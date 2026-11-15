import type Stripe from "stripe";
import { getAdmin } from "./supabase-admin";
import { getStripe } from "./stripe";

export type OrderResult =
  | { ok: true; listingId: number; amountCents: number; buyerEmail: string | null }
  | { ok: false; reason: "unpaid" | "no_listing" };

// Saves the order and marks the listing Sold. Safe to run more than once.
export async function recordOrder(sessionId: string): Promise<OrderResult> {
  // Ask Stripe directly, so we never trust data from the browser
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (session.payment_status !== "paid") return { ok: false, reason: "unpaid" };

  const listingId = Number(session.metadata?.listing_id);
  if (!Number.isInteger(listingId)) return { ok: false, reason: "no_listing" };

  const intent = session.payment_intent as Stripe.PaymentIntent | null;
  const amountCents = session.amount_total ?? 0;
  const buyerEmail = session.customer_details?.email ?? null;

  const admin = getAdmin();

  const { error } = await admin.from("orders").upsert(
    {
      listing_id: listingId,
      stripe_session_id: session.id,
      stripe_payment_intent: intent?.id ?? null,
      buyer_email: buyerEmail,
      amount_cents: amountCents,
      fee_cents: intent?.application_fee_amount ?? 0,
      currency: session.currency ?? "usd",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true }
  );
  if (error) throw error;

  const { error: soldError } = await admin
    .from("listings")
    .update({ sold: true })
    .eq("id", listingId);
  if (soldError) throw soldError;

  return { ok: true, listingId, amountCents, buyerEmail };
}