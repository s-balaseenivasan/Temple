import crypto from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RazorpayPaymentProvider } from "./razorpay-provider";
import { isMockPaymentsAllowed, getPaymentProvider } from "./index";

const WEBHOOK_SECRET = "test_webhook_secret";

function signed(body: object) {
  const raw = JSON.stringify(body);
  return { raw, signature: crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex") };
}

function paymentEvent(event: string) {
  return { event, payload: { payment: { entity: { id: "pay_123", order_id: "order_456" } } } };
}

// Security-review regression guards for the real-gateway webhook: only the
// two terminal events may drive donation state, and signatures must match.
describe("RazorpayPaymentProvider.parseWebhook", () => {
  beforeEach(() => vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET));
  afterEach(() => vi.unstubAllEnvs());

  const provider = new RazorpayPaymentProvider();

  it("maps payment.captured to a success", () => {
    const { raw, signature } = signed(paymentEvent("payment.captured"));
    expect(provider.parseWebhook(raw, signature)).toMatchObject({ valid: true, event: "payment.success", providerOrderId: "order_456" });
  });

  it("maps payment.failed to a failure", () => {
    const { raw, signature } = signed(paymentEvent("payment.failed"));
    expect(provider.parseWebhook(raw, signature)).toMatchObject({ valid: true, event: "payment.failed" });
  });

  it.each(["payment.authorized", "order.paid", "refund.created"])("ignores %s instead of treating it as a failure", (event) => {
    const { raw, signature } = signed(paymentEvent(event));
    expect(provider.parseWebhook(raw, signature)).toMatchObject({ valid: true, event: "unknown" });
  });

  it("rejects a tampered body", () => {
    const { signature } = signed(paymentEvent("payment.captured"));
    const tampered = JSON.stringify(paymentEvent("payment.captured")).replace("pay_123", "pay_999");
    expect(provider.parseWebhook(tampered, signature)).toMatchObject({ valid: false, reason: "signature_mismatch" });
  });

  it("rejects a signature of the wrong length without throwing", () => {
    const { raw } = signed(paymentEvent("payment.captured"));
    expect(provider.parseWebhook(raw, "abc")).toMatchObject({ valid: false });
  });
});

describe("mock payments are refused in production", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is allowed in development with the default provider", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "");
    delete process.env.PAYMENT_PROVIDER;
    expect(isMockPaymentsAllowed()).toBe(true);
  });

  it("is refused in production when PAYMENT_PROVIDER is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.PAYMENT_PROVIDER;
    expect(isMockPaymentsAllowed()).toBe(false);
    expect(() => getPaymentProvider()).toThrow(/mock/);
  });

  it("can be opted into explicitly for staging", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("ALLOW_MOCK_PAYMENTS", "true");
    expect(isMockPaymentsAllowed()).toBe(true);
  });
});
