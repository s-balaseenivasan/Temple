import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock-provider";
import { RazorpayPaymentProvider } from "./razorpay-provider";

export type { PaymentProvider } from "./types";

/**
 * Factory — selects the adapter via PAYMENT_PROVIDER env var. CR-001 (final
 * gateway) is unresolved, so this defaults to "mock" for local development;
 * production deployment must set PAYMENT_PROVIDER=razorpay (or whichever
 * gateway is finally chosen) plus that adapter's credentials.
 */
/**
 * Security review: the mock provider signs with a well-known default secret
 * and its /api/mock-gateway/resolve endpoint lets anyone mark a donation
 * paid. It must never be live in production by accident (e.g. an unset
 * PAYMENT_PROVIDER), so it is refused when NODE_ENV=production unless a
 * staging deployment opts in explicitly with ALLOW_MOCK_PAYMENTS=true.
 */
export function isMockPaymentsAllowed(): boolean {
  if ((process.env.PAYMENT_PROVIDER ?? "mock") !== "mock") return false;
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "true";
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (name) {
    case "razorpay":
      return new RazorpayPaymentProvider();
    case "mock":
      if (!isMockPaymentsAllowed()) {
        throw new Error("PAYMENT_PROVIDER is 'mock' (or unset) in production — configure a real gateway.");
      }
      return new MockPaymentProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${name}"`);
  }
}
