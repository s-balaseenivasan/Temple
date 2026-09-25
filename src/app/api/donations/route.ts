import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payment";
import { donationFormSchema } from "@/lib/validation/donation";
import { localizeFieldErrors } from "@/lib/validation/messages";
import { getLocale } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Hardening pass: 10 donation submissions per 10 minutes per IP — generous
// enough for a real donor retrying after a failed/cancelled payment attempt,
// tight enough to block automated flooding of this endpoint (ASSUMPTION,
// same category as FEAT-074's threshold — standard practice, not from the
// brief). RULE-012 already means a flood here can never fake a successful
// donation, so this is about resource abuse, not fund-safety.
const DONATION_RATE_LIMIT = 10;
const DONATION_RATE_WINDOW_MS = 10 * 60 * 1000;

// FEAT-034/035/036/037: public donation form submit + payment order creation.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`donation:${ip}`, DONATION_RATE_LIMIT, DONATION_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = donationFormSchema.safeParse(body);
  if (!parsed.success) {
    const locale = await getLocale();
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "validation_error", details: { fieldErrors: localizeFieldErrors(flat.fieldErrors, locale) } },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const purpose = await prisma.donationPurpose.findUnique({ where: { id: data.purposeId } });
  if (!purpose || !purpose.active) {
    return NextResponse.json({ error: "invalid_purpose" }, { status: 400 });
  }

  const donation = await prisma.donation.create({
    data: {
      donorName: data.donorName,
      mobile: data.mobile,
      email: data.email || null,
      address: data.address || null,
      pan: data.pan ? data.pan.toUpperCase() : null,
      amount: data.amount,
      purposeId: data.purposeId,
      anonymous: data.anonymous,
      donationType: "cash_online",
      status: "pending",
    },
  });

  const provider = getPaymentProvider();
  const order = await provider.createOrder({
    donationId: donation.id,
    amountRupees: data.amount.toFixed(2),
    receiptHint: donation.id,
  });

  await prisma.payment.create({
    data: {
      donationId: donation.id,
      provider: provider.name,
      providerOrderId: order.providerOrderId,
      status: "initiated",
    },
  });

  return NextResponse.json({
    donationId: donation.id,
    providerOrderId: order.providerOrderId,
    clientConfig: order.clientConfig,
  });
}
