import { notFound } from "next/navigation";
import { isMockPaymentsAllowed } from "@/lib/payment";

interface Props {
  searchParams: Promise<{ orderId?: string; donationId?: string; amount?: string }>;
}

// Simulates a gateway-hosted checkout page (dev only, PAYMENT_PROVIDER=mock).
// Real Razorpay/etc. checkout is an embedded widget the temple never controls
// the UI of — this stands in for that so the rest of the flow (RULE-012:
// return page never trusts this step, only the webhook does) can be tested.
export default async function MockCheckoutPage({ searchParams }: Props) {
  if (!isMockPaymentsAllowed()) notFound();
  const { orderId, donationId, amount } = await searchParams;

  if (!orderId || !donationId) {
    return <div className="p-8 text-center text-error">Missing order parameters.</div>;
  }

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center py-16">
      <div className="panel w-full max-w-sm p-8">
        <p className="mb-1 text-center text-xs uppercase tracking-wide text-text-secondary">
          Mock Payment Gateway (dev only)
        </p>
        <h1 className="mb-8 text-center font-display text-3xl font-semibold text-text-primary">Pay ₹{amount}</h1>

        <form action="/api/mock-gateway/resolve" method="POST" className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="donationId" value={donationId} />
          <button
            type="submit"
            name="outcome"
            value="success"
            className="btn h-12 w-full bg-success text-white hover:opacity-90"
          >
            Simulate Successful Payment
          </button>
          <button
            type="submit"
            name="outcome"
            value="failed"
            className="btn h-12 w-full bg-error text-white hover:opacity-90"
          >
            Simulate Failed Payment
          </button>
        </form>
      </div>
    </div>
  );
}
