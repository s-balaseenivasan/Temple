/**
 * Gateway-agnostic payment adapter interface — INTEGRATION_SPEC.md / TECHNICAL_ARCHITECTURE.md.
 * CR-001 (final gateway) is still a BLOCKING DECISION per the blueprint; every donation
 * endpoint is written against this interface, never against a specific provider's field
 * names, so that decision can be resolved later without touching the donation flow itself.
 */

export interface CreateOrderParams {
  donationId: string;
  amountRupees: string; // decimal string, e.g. "501.00" — never a float
  receiptHint: string; // a short reference string shown in the provider's own dashboard
}

export interface CreateOrderResult {
  providerOrderId: string;
  // Fields a client-side checkout widget needs — provider-specific, passed through opaquely.
  clientConfig: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  reason?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event: "payment.success" | "payment.failed" | "unknown";
  providerOrderId?: string;
  providerPaymentId?: string;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: "razorpay" | "payu" | "cashfree" | "instamojo" | "mock";
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  /** RULE-012 / RULE-SEC-10: server-side verification, never trust the client alone. */
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  /** RULE-SEC-11/12: signature-verified, idempotent-safe webhook parsing. */
  parseWebhook(rawBody: string, signatureHeader: string | null): WebhookVerificationResult;
}
