import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo } from "@/lib/format";
import type { Listing } from "@/lib/types";
import MessageSeller from "@/components/MessageSeller";

async function ListingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (!data) notFound();
  const l = data as Listing;

  return (
    <div className="detail">
      <div className="detail-media">
        {l.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image_url} alt={l.title} />
        ) : (
          <span>No photo</span>
        )}
      </div>

      <div className="detail-info">
        <Link href="/" className="link">← Back to Marketplace</Link>
        <h1>{l.title}</h1>
        <div className="detail-price">{formatPrice(l.price)}</div>
        <p className="muted">
          Listed {timeAgo(l.created_at)}
          {l.location && ` in ${l.location}`}
        </p>

        <dl className="facts">
          <dt>Category</dt>
          <dd>{l.category}</dd>
          <dt>Seller email</dt>
          <dd><a className="link" href={`mailto:${l.seller_email}`}>{l.seller_email}</a></dd>
        </dl>

        {l.description && (
          <>
            <h2>Description</h2>
            <p className="desc">{l.description}</p>
          </>
        )}

        <MessageSeller listingId={l.id} title={l.title} />
      </div>
    </div>
  );
}

export default function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 20 }}>Loading...</p>}>
      <ListingContent params={params} />
    </Suspense>
  );
}