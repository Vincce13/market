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

  if (!seller) {
    return {
      exists: false,
      ready: false,
      accountId: null as string | null,
      detailsSubmitted: false,
      chargesEnabled: false,
      due: [] as string[],
      disabledReason: null as string | null,
    };
  }

  const account = await getStripe().accounts.retrieve(seller.stripe_account_id);
  const detailsSubmitted = Boolean(account.details_submitted);
  const chargesEnabled = Boolean(account.charges_enabled);
  const ready = detailsSubmitted && chargesEnabled;

  if (ready !== seller.charges_enabled) {
    await admin.from("sellers").update({ charges_enabled: ready }).eq("email", email);
  }

  return {
    exists: true,
    ready,
    accountId: seller.stripe_account_id as string,
    detailsSubmitted,
    chargesEnabled,
    due: account.requirements?.currently_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  };
}