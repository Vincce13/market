import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

type SearchParams = { q?: string; category?: string; min?: string; max?: string };
type Card = Pick<Listing, "id" | "title" | "price" | "location" | "image_url">;

function href(params: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) sp.set(key, value);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

async function Marketplace({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q = "", category = "", min = "", max = "" } = await searchParams;

  let query = supabase
    .from("listings")
    .select("id, title, price, location, image_url")
    .order("created_at", { ascending: false })
    .limit(60);

  // strip characters that have special meaning in the filter syntax
  const term = q.replace(/[%_,()\\*]/g, " ").trim();
  if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);

  if ((CATEGORIES as readonly string[]).includes(category)) {
    query = query.eq("category", category);
  }
  if (min !== "" && !Number.isNaN(Number(min))) query = query.gte("price", Number(min));
  if (max !== "" && !Number.isNaN(Number(max))) query = query.lte("price", Number(max));

  const { data, error } = await query;
  const listings = (data ?? []) as Card[];
  const filtered = Boolean(term || category || min || max);

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="side-title">Marketplace</h1>

        <form action="/" className="filters">
          {category && <input type="hidden" name="category" value={category} />}
          <input
            className="field"
            name="q"
            defaultValue={q}
            placeholder="Search Marketplace"
          />
          <div className="price-row">
            <input className="field" name="min" type="number" min="0" defaultValue={min} placeholder="Min" />
            <span>to</span>
            <input className="field" name="max" type="number" min="0" defaultValue={max} placeholder="Max" />
          </div>
          <button className="btn block">Search</button>
        </form>

        <h2 className="side-sub">Categories</h2>
        <ul className="cats">
          <li>
            <Link className={!category ? "active" : ""} href={href({ q, min, max })}>
              All
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                className={category === c ? "active" : ""}
                href={href({ q, min, max, category: c })}
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <main className="results">
        <h2 className="results-title">{filtered ? "Search results" : "Today's picks"}</h2>

        {error && <p className="error">Couldn&apos;t load listings: {error.message}</p>}

        {!error && listings.length === 0 && (
          <p className="muted">
            No listings found. <Link href="/sell" className="link">Create one</Link>.
          </p>
        )}

        <div className="grid">
          {listings.map((l) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="card">
              <div className="card-img">
                {l.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image_url} alt={l.title} loading="lazy" />
                ) : (
                  <span>No photo</span>
                )}
              </div>
              <div className="card-price">{formatPrice(l.price)}</div>
              <div className="card-title">{l.title}</div>
              {l.location && <div className="card-loc">{l.location}</div>}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 20 }}>Loading...</p>}>
      <Marketplace searchParams={searchParams} />
    </Suspense>
  );
}