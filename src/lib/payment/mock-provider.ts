import crypto from "node:crypto";

// Constant-time comparison for HMAC signatures (avoids leaking how many
// leading characters of a forged signature were correct).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
import type {
  PaymentProvider,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  WebhookVerificationResult,
} from "./types";

const MOCK_SECRET = process.env.MOCK_GATEWAY_SECRET ?? "mock-dev-secret-do-not-use-in-prod";

function sign(orderId: string, paymentId: string) {
  return crypto.createHmac("sha256", MOCK_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

/**
 * A local, in-process stand-in for a real gateway (Razorpay etc., CR-001 still
 * open) so the full donation flow — including the RULE-012 requirement that a
 * client redirect alone must NEVER mark a donation successful — is genuinely
 * exercisable without live gateway credentials. See src/app/donate/[id]/mock-checkout
 * for the simulated hosted-checkout page and src/app/api/mock-gateway/resolve
 * for the endpoint that plays the role of the gateway server.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const providerOrderId = `mock_order_${crypto.randomUUID()}`;
    return {
      providerOrderId,
      clientConfig: {
        checkoutUrl: `/donate/mock-checkout?orderId=${providerOrderId}&donationId=${params.donationId}&amount=${params.amountRupees}`,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const expected = sign(params.providerOrderId, params.providerPaymentId);
    if (!safeEqual(expected, params.providerSignature)) {
      return { verified: false, reason: "signature_mismatch" };
    }
    return { verified: true };
  }

  parseWebhook(rawBody: string, signatureHeader: string | null): WebhookVerificationResult {
    let payload: { providerOrderId?: string; providerPaymentId?: string; outcome?: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, event: "unknown", reason: "invalid_json" };
    }
    if (!payload.providerOrderId || !payload.providerPaymentId || !signatureHeader) {
      return { valid: false, event: "unknown", reason: "missing_fields" };
    }
    const expected = sign(payload.providerOrderId, payload.providerPaymentId);
    if (!safeEqual(expected, signatureHeader)) {
      return { valid: false, event: "unknown", reason: "signature_mismatch" };
    }
    return {
      valid: true,
      event: payload.outcome === "success" ? "payment.success" : "payment.failed",
      providerOrderId: payload.providerOrderId,
      providerPaymentId: payload.providerPaymentId,
    };
  }
}

export function mockSignPayload(providerOrderId: string, providerPaymentId: string) {
  return sign(providerOrderId, providerPaymentId);
}
