import { Suspense } from "react";
import Link from "next/link";
import { recordOrder } from "@/lib/orders";
import { getAdmin } from "@/lib/supabase-admin";
import { formatPrice } from "@/lib/format";

async function Result({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id || !session_id.startsWith("cs_")) {
    return (
      <>
        <h1>Nothing to show</h1>
        <Link href="/" className="link">Back to Marketplace</Link>
      </>
    );
  }

  let result;
  try {
    result = await recordOrder(session_id);
  } catch (e) {
    console.error("Success page error:", e);
    return (
      <>
        <h1>Payment received</h1>
        <p className="muted">
          Your payment went through, but we had trouble saving the order. Please
          refresh this page in a moment.
        </p>
      </>
    );
  }

  if (!result.ok) {
    return (
      <>
        <h1>Payment not completed</h1>
        <p className="muted">No charge was made. You can try again from the listing.</p>
        <Link href="/" className="btn primary">Back to Marketplace</Link>
      </>
    );
  }

  const { data: listing } = await getAdmin()
    .from("listings")
    .select("title")
    .eq("id", result.listingId)
    .maybeSingle();

  return (
    <>
      <h1>Thank you! 🎉</h1>
      <p>
        Your payment of <strong>{formatPrice(result.amountCents / 100)}</strong>
        {listing ? <> for <strong>{listing.title}</strong></> : null} was successful.
      </p>
      {result.buyerEmail && (
        <p className="muted">A receipt was sent to {result.buyerEmail}.</p>
      )}
      <Link href="/" className="btn primary">Keep browsing</Link>
    </>
  );
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return (
    <div className="form-page">
      <div className="panel">
        <Suspense fallback={<p className="muted">Confirming your payment...</p>}>
          <Result searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}   