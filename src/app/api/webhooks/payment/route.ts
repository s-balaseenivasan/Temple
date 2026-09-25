import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import { processPaymentWebhookEvent } from "@/lib/donation-service";

// FEAT-040 / RULE-SEC-11/12: the authoritative, signature-verified webhook
// receiver for the real (non-mock) gateway. This is the ONLY code path (other
// than EP-46 offline recording) that may ever mark a Donation `success`.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? req.headers.get("x-webhook-signature");

  const provider = getPaymentProvider();
  const parsed = provider.parseWebhook(rawBody, signature);

  // Authentic but irrelevant event (see razorpay-provider.ts): acknowledge
  // with 200 so the gateway doesn't retry it, but never touch state.
  if (parsed.valid && parsed.event === "unknown") {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!parsed.valid || !parsed.providerOrderId || !parsed.providerPaymentId) {
    // RULE-SEC-11: invalid signature -> reject, log, never process the payload.
    console.warn("Webhook rejected:", parsed.reason);
    return NextResponse.json({ error: "invalid_webhook" }, { status: 400 });
  }

  const result = await processPaymentWebhookEvent({
    provider: provider.name,
    providerOrderId: parsed.providerOrderId,
    providerPaymentId: parsed.providerPaymentId,
    outcome: parsed.event === "payment.success" ? "success" : "failed",
    rawPayload: JSON.parse(rawBody),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ received: true });
}
