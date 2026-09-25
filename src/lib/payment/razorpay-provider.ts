import crypto from "node:crypto";

// Constant-time comparison for HMAC signatures.
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

/**
 * Reference implementation per INTEGRATION_SPEC.md / blueprint CR-001 — Razorpay
 * is NOT the finalized gateway (still a BLOCKING DECISION), this is the
 * documented reference adapter so the PaymentProvider interface has a real,
 * non-mock implementation to validate the abstraction against. Requires
 * RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET to actually
 * function — throws a clear error if used without them, rather than silently
 * doing nothing.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = "razorpay" as const;

  private get keyId() {
    const v = process.env.RAZORPAY_KEY_ID;
    if (!v) throw new Error("RAZORPAY_KEY_ID is not configured (CR-001 gateway not finalized)");
    return v;
  }

  private get keySecret() {
    const v = process.env.RAZORPAY_KEY_SECRET;
    if (!v) throw new Error("RAZORPAY_KEY_SECRET is not configured (CR-001 gateway not finalized)");
    return v;
  }

  private get webhookSecret() {
    const v = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!v) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured (CR-001 gateway not finalized)");
    return v;
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const amountPaise = Math.round(Number(params.amountRupees) * 100);
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR", // RULE-001: INR only
        receipt: params.receiptHint,
      }),
    });

    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${res.status} ${await res.text()}`);
    }

    const order = (await res.json()) as { id: string };
    return {
      providerOrderId: order.id,
      clientConfig: { keyId: this.keyId, orderId: order.id, amount: amountPaise, currency: "INR" },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // Razorpay's documented signature scheme: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac("sha256", this.keySecret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest("hex");

    if (!safeEqual(expected, params.providerSignature)) {
      return { verified: false, reason: "signature_mismatch" };
    }
    return { verified: true };
  }

  parseWebhook(rawBody: string, signatureHeader: string | null): WebhookVerificationResult {
    if (!signatureHeader) return { valid: false, event: "unknown", reason: "missing_signature" };

    const expected = crypto.createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    if (!safeEqual(expected, signatureHeader)) {
      return { valid: false, event: "unknown", reason: "signature_mismatch" };
    }

    let payload: {
      event: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, event: "unknown", reason: "invalid_json" };
    }

    const entity = payload.payload?.payment?.entity;
    return {
      valid: true,
      // Only the two terminal payment events drive state. Everything else
      // Razorpay may deliver on the same subscription (payment.authorized,
      // order.paid, refund.*) is acknowledged but ignored — previously any
      // non-"captured" event was treated as a failure, so a
      // payment.authorized arriving before payment.captured marked a paid
      // donation "failed" permanently (terminal states never transition).
      event: payload.event === "payment.captured" ? "payment.success" : payload.event === "payment.failed" ? "payment.failed" : "unknown",
      providerOrderId: entity?.order_id,
      providerPaymentId: entity?.id,
    };
  }
}
