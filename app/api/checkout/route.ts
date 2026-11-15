import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdmin } from "@/lib/supabase-admin";
import { refreshSeller } from "@/lib/sellers";
import { CURRENCY } from "@/lib/format";

const PLATFORM_FEE_PERCENT = 10;
const MIN_AMOUNT_CENTS = 50;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: { listingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  const listingId = Number(body.listingId);
  if (!Number.isInteger(listingId)) return fail("Invalid listing.");

  try {
    const admin = getAdmin();

    // 1. load the listing from OUR database (never trust a price sent by the browser)
    const { data: listing } = await admin
      .from("listings")
      .select("id, title, price, seller_email, image_url, sold")
      .eq("id", listingId)
      .maybeSingle();

    if (!listing) return fail("Listing not found.", 404);
    if (listing.sold) return fail("Sorry, this item has already been sold.", 409);

    const amount = Math.round(Number(listing.price) * 100);
    if (amount < MIN_AMOUNT_CENTS) return fail("This item can't be purchased online.");

    // 2. the seller must have finished Stripe onboarding (checked live with Stripe)
    const seller = await refreshSeller(String(listing.seller_email).toLowerCase());
    if (!seller.ready || !seller.accountId) {
      return fail("This seller hasn't finished setting up payments yet.", 403);
    }

    // 3. create the Checkout Session: money goes to the seller, we keep the fee
    const fee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
    const origin = new URL(req.url).origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY.toLowerCase(),
            unit_amount: amount,
            product_data: {
              name: listing.title,
              ...(listing.image_url ? { images: [listing.image_url] } : {}),
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: { destination: seller.accountId },
        metadata: { listing_id: String(listing.id) },
      },
      metadata: { listing_id: String(listing.id) },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/listing/${listing.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout error:", e);
    return fail(e instanceof Error ? e.message : "Could not start checkout.", 500);
  }
}