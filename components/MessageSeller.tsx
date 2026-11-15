"use client";

import { useState } from "react";

export default function MessageSeller({
  listingId,
  title,
}: {
  listingId: number;
  title: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Hi, is "${title}" still available?`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, name, email, message }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setDone(
          json.emailed
            ? "Message sent! The seller has been emailed."
            : "Message saved, but the email notification didn't go out."
        );
        setMessage("");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form className="message-box" onSubmit={send}>
      <h2>Message seller</h2>

      <input className="field" placeholder="Your name" value={name} maxLength={60}
             onChange={(e) => setName(e.target.value)} required />
      <input className="field" type="email" placeholder="Your email (so the seller can reply)"
             value={email} onChange={(e) => setEmail(e.target.value)} required />
      <textarea className="field" rows={4} value={message} maxLength={1000}
                onChange={(e) => setMessage(e.target.value)} required />

      {error && <p className="error">{error}</p>}
      {done && <p className="success">{done}</p>}

      <button className="btn primary block" disabled={busy}>
        {busy ? "Sending..." : "Message Seller"}
      </button>
    </form>
  );
}