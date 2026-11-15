import { Suspense } from "react";
import SellForm from "@/components/SellForm";

async function Form({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return <SellForm initialEmail={email.trim().toLowerCase()} />;
}

export default function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <Suspense fallback={<p className="muted" style={{ padding: 20 }}>Loading...</p>}>
      <Form searchParams={searchParams} />
    </Suspense>
  );
}