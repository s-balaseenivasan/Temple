import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { mockSignPayload } from "@/lib/payment/mock-provider";
import { isMockPaymentsAllowed } from "@/lib/payment";

/**
 * Plays the role of the payment gateway's own server in local dev (only
 * reachable when PAYMENT_PROVIDER=mock). It does two things a real gateway
 * would do independently of each other: (1) fires a signed, server-to-server
 * webhook call to our own /api/webhooks/payment — the ONLY thing that actually
 * changes Donation state — and (2) redirects the browser back to our return
 * URL. The browser redirect is deliberately treated as untrustworthy by the
 * return page (RULE-012) — it only shows "Verifying...", it never reads the
 * outcome from the query string to decide anything.
 */
export async function POST(req: NextRequest) {
  if (!isMockPaymentsAllowed()) {
    return NextResponse.json({ error: "mock_gateway_disabled" }, { status: 404 });
  }

  const form = await req.formData();
  const providerOrderId = String(form.get("orderId"));
  const donationId = String(form.get("donationId"));
  const outcome = String(form.get("outcome")) === "success" ? "success" : "failed";
  const providerPaymentId = `mock_pay_${crypto.randomUUID()}`;
  const signature = mockSignPayload(providerOrderId, providerPaymentId);

  const webhookBody = JSON.stringify({ providerOrderId, providerPaymentId, outcome });

  // Real HTTP round-trip to our own webhook route — exercises the full
  // signature-verification chain, not a shortcut/direct function call.
  await fetch(new URL("/api/webhooks/payment", req.nextUrl.origin), {
    method: "POST",
    headers: { "x-webhook-signature": signature, "content-type": "application/json" },
    body: webhookBody,
  }).catch((err) => console.error("Mock gateway -> webhook call failed:", err));

  return NextResponse.redirect(
    new URL(`/donate/${donationId}?outcome=${outcome}`, req.nextUrl.origin),
    { status: 303 },
  );
}
