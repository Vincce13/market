import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  const listingId = Number(body.listingId);
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!Number.isInteger(listingId)) return fail("Invalid listing.");
  if (!name || name.length > 60) return fail("Please enter your name.");
  if (!EMAIL_RE.test(email) || email.length > 254) return fail("Please enter a valid email.");
  if (!message || message.length > 1000) return fail("Message must be 1 to 1000 characters.");

  // find the listing and the seller's email
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, seller_email")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return fail("Listing not found.", 404);

  // 1. store the message
  const { error: insertError } = await supabase.from("messages").insert({
    listing_id: listing.id,
    buyer_name: name,
    buyer_email: email,
    body: message,
  });
  if (insertError) return fail("Could not save your message.", 500);

  // 2. email the seller (plain text, so nothing a buyer types can inject HTML)
  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const { error: mailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Marketplace <onboarding@resend.dev>",
      to: listing.seller_email,
      replyTo: email,
      subject: `New message about "${listing.title}"`.replace(/[\r\n]+/g, " "),
      text: `${name} (${email}) wrote:\n\n${message}\n\nReply to this email to answer ${name} directly.`,
    });
    if (mailError) console.error("Resend error:", mailError);
    emailed = !mailError;
  } else {
    console.warn("RESEND_API_KEY is not set, so the email was skipped.");
  }

  return NextResponse.json({ ok: true, emailed });
}