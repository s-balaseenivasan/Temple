import { describe, it, expect } from "vitest";
import { MockPaymentProvider, mockSignPayload } from "./mock-provider";

// RULE-012 / RULE-SEC-10/11: the single most security-critical property in
// this entire application — a payment must never be trusted without a valid,
// server-verifiable signature. This was manually verified via curl/Playwright
// during development (forged webhook rejected, tampered signature rejected);
// this test suite turns that manual finding into a permanent regression
// guard so a future change can't silently reintroduce the vulnerability.
describe("MockPaymentProvider.parseWebhook (RULE-SEC-11 signature verification)", () => {
  const provider = new MockPaymentProvider();

  it("accepts a webhook with a correctly-signed payload", () => {
    const orderId = "mock_order_abc";
    const paymentId = "mock_pay_xyz";
    const signature = mockSignPayload(orderId, paymentId);
    const body = JSON.stringify({ providerOrderId: orderId, providerPaymentId: paymentId, outcome: "success" });

    const result = provider.parseWebhook(body, signature);

    expect(result.valid).toBe(true);
    expect(result.event).toBe("payment.success");
    expect(result.providerOrderId).toBe(orderId);
  });

  it("REJECTS a webhook with a forged/mismatched signature — the core security property", () => {
    const body = JSON.stringify({ providerOrderId: "mock_order_abc", providerPaymentId: "mock_pay_xyz", outcome: "success" });

    const result = provider.parseWebhook(body, "totally-forged-signature");

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });

  it("REJECTS a webhook with no signature header at all", () => {
    const body = JSON.stringify({ providerOrderId: "mock_order_abc", providerPaymentId: "mock_pay_xyz", outcome: "success" });

    const result = provider.parseWebhook(body, null);

    expect(result.valid).toBe(false);
  });

  it("REJECTS a signature that was valid for a DIFFERENT payload (prevents payload substitution)", () => {
    const realSignature = mockSignPayload("mock_order_real", "mock_pay_real");
    // Attacker reuses a valid signature but swaps in different order/payment IDs.
    const tamperedBody = JSON.stringify({ providerOrderId: "mock_order_ATTACKER", providerPaymentId: "mock_pay_real", outcome: "success" });

    const result = provider.parseWebhook(tamperedBody, realSignature);

    expect(result.valid).toBe(false);
  });

  it("rejects malformed JSON without throwing", () => {
    const result = provider.parseWebhook("not json at all", "some-signature");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid_json");
  });

  it("correctly distinguishes a failed-payment outcome from a success", () => {
    const orderId = "mock_order_fail";
    const paymentId = "mock_pay_fail";
    const signature = mockSignPayload(orderId, paymentId);
    const body = JSON.stringify({ providerOrderId: orderId, providerPaymentId: paymentId, outcome: "failed" });

    const result = provider.parseWebhook(body, signature);

    expect(result.valid).toBe(true);
    expect(result.event).toBe("payment.failed");
  });
});

describe("MockPaymentProvider.verifyPayment (RULE-012 return-URL verification)", () => {
  const provider = new MockPaymentProvider();

  it("verifies successfully with a matching signature", async () => {
    const orderId = "mock_order_1";
    const paymentId = "mock_pay_1";
    const signature = mockSignPayload(orderId, paymentId);

    const result = await provider.verifyPayment({ providerOrderId: orderId, providerPaymentId: paymentId, providerSignature: signature });

    expect(result.verified).toBe(true);
  });

  it("REJECTS a client-supplied signature that doesn't match — this is what prevents a forged success redirect from being trusted", async () => {
    const result = await provider.verifyPayment({
      providerOrderId: "mock_order_1",
      providerPaymentId: "mock_pay_1",
      providerSignature: "forged",
    });

    expect(result.verified).toBe(false);
    expect(result.reason).toBe("signature_mismatch");
  });
});
