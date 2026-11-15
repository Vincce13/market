"use client";

import { useState } from "react";

export default function ConnectForm({
  initialEmail = "",
  label = "Connect with Stripe",
}: {
  initialEmail?: string;
  label?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.url) {
        setError(json.error ?? "Could not start Stripe onboarding.");
        setBusy(false);
        return;
      }

      window.location.href = json.url;

    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start}>
      <label className="label">
        Your Stripe account email
      </label>

      <input
        className="field"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seller@example.com"
        required
      />

      <p className="hint">
        Connect Stripe to receive payments from your listings.
      </p>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <button
        className="btn primary block"
        disabled={busy}
      >
        {busy ? "Redirecting to Stripe..." : label}
      </button>
    </form>
  );
}