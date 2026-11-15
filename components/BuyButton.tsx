"use client";

import { useState } from "react";

export default function BuyButton({
  listingId,
  priceLabel,
}: {
  listingId: number;
  priceLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = json.url; // go to Stripe Checkout
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="buy-box">
      <button className="btn primary block" onClick={buy} disabled={busy}>
        {busy ? "Redirecting to Stripe..." : `Buy Now · ${priceLabel}`}
      </button>
      {error && <p className="error">{error}</p>}
      <p className="hint">Secure payment by Stripe. Test mode: no real money moves.</p>
    </div>
  );
}