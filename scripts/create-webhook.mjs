import Stripe from "stripe";

const target = process.argv[2];
if (!target || !target.startsWith("https://")) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app/api/stripe/webhook"
  );
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// remove an older endpoint with the same URL so running this twice doesn't create duplicates
const existing = await stripe.webhookEndpoints.list({ limit: 100 });
for (const e of existing.data) {
  if (e.url === target) await stripe.webhookEndpoints.del(e.id);
}

const endpoint = await stripe.webhookEndpoints.create({
  url: target,
  enabled_events: ["checkout.session.completed"],
});

console.log("Webhook created:", endpoint.id);
console.log("Signing secret:", endpoint.secret);