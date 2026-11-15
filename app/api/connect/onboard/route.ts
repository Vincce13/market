import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdmin } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return fail("Please enter a valid email.");

  try {
    const stripe = getStripe();
    const admin = getAdmin();

    // 1. find the seller's Stripe account, or create it
    const { data: seller } = await admin
      .from("sellers")
      .select("stripe_account_id")
      .eq("email", email)
      .maybeSingle();

    let accountId = seller?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { seller_email: email },
      });

      const { error: insertError } = await admin
        .from("sellers")
        .insert({ email, stripe_account_id: account.id });

      if (insertError) {
        // two clicks at once: use the row that won
        const { data: existing } = await admin
          .from("sellers")
          .select("stripe_account_id")
          .eq("email", email)
          .maybeSingle();
        if (!existing) return fail("Could not save your account.", 500);
        accountId = existing.stripe_account_id;
      } else {
        accountId = account.id;
      }
    }

    // 2. create a fresh onboarding link (they expire quickly, so never reuse one)
    const origin = new URL(req.url).origin;
    const returnUrl = `${origin}/seller/return?email=${encodeURIComponent(email)}`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: returnUrl,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("Onboarding error:", e);
    return fail(e instanceof Error ? e.message : "Could not start onboarding.", 500);
  }
}