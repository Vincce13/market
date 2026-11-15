import { getAdmin } from "./supabase-admin";
import { getStripe } from "./stripe";

// Asks Stripe for the seller's current status and saves it in Supabase
export async function refreshSeller(email: string) {
  const admin = getAdmin();

  const { data: seller } = await admin
    .from("sellers")
    .select("email, stripe_account_id, charges_enabled")
    .eq("email", email)
    .maybeSingle();

  if (!seller) return { exists: false, ready: false };

  const account = await getStripe().accounts.retrieve(seller.stripe_account_id);
  const ready = Boolean(account.details_submitted && account.charges_enabled);

  if (ready !== seller.charges_enabled) {
    await admin.from("sellers").update({ charges_enabled: ready }).eq("email", email);
  }

  return { exists: true, ready };
}