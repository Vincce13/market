import { Suspense } from "react";
import Link from "next/link";
import { refreshSeller } from "@/lib/sellers";
import ConnectForm from "@/components/ConnectForm";

async function Status({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  const clean = email.trim().toLowerCase();

  if (!clean) {
    return (
      <>
        <h1>Missing email</h1>
        <Link href="/seller" className="link">Start again</Link>
      </>
    );
  }

  let status;
  try {
    status = await refreshSeller(clean);
  } catch (e) {
    console.error("Status check failed:", e);
    return <p className="error">Couldn&apos;t check your Stripe account. Please refresh the page.</p>;
  }

  if (!status.exists) {
    return (
      <>
        <h1>No Stripe account yet</h1>
        <ConnectForm initialEmail={clean} />
      </>
    );
  }

  if (status.ready) {
    return (
      <>
        <h1>You&apos;re connected ✅</h1>
        <p>
          Stripe is ready to pay you. Listings that use <strong>{clean}</strong> now
          show a Buy Now button.
        </p>
        <Link href="/" className="btn primary">Back to Marketplace</Link>
      </>
    );
  }

  return (
    <>
      <h1>Almost there</h1>
      <p className="muted">
        Stripe still needs a few details, or is reviewing them. Continue where you
        left off, or refresh this page in a few seconds.
      </p>
      <ConnectForm initialEmail={clean} label="Continue onboarding" />
    </>
  );
}

export default function SellerReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <div className="form-page">
      <div className="panel">
        <Suspense fallback={<p className="muted">Checking your Stripe account...</p>}>
          <Status searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}