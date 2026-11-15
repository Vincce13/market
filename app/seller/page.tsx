import ConnectForm from "@/components/ConnectForm";

export default function SellerPage() {
  return (
    <div className="form-page">
      <div className="panel">
        <h1>Get paid with Stripe</h1>
        <p className="muted">
          Connect a Stripe account so buyers can pay you directly. The marketplace
          keeps a 10% platform fee, and Stripe handles your identity and bank details.
        </p>
        <ConnectForm />
      </div>
    </div>
  );
}