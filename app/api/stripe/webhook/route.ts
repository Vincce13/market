import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { recordOrder } from "@/lib/orders";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  // Signature checking needs the raw text of the request, not parsed JSON
  const rawBody = await req.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await recordOrder(event.data.object.id);
    } catch (e) {
      console.error("Webhook failed to record order:", e);
      // a 500 tells Stripe to try again later
      return NextResponse.json({ error: "Could not record order." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}