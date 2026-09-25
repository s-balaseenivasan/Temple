import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactEnquirySchema } from "@/lib/validation/settings";
import { localizeFieldErrors } from "@/lib/validation/messages";
import { getLocale } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Same rate-limit posture as /api/member-requests — another low-volume,
// no-login public form.
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000;

// FEAT-012: public visitor create-only. enquirerType is required per brief §11.5.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = contactEnquirySchema.safeParse(body);
  if (!parsed.success) {
    const locale = await getLocale();
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "validation_error", details: { fieldErrors: localizeFieldErrors(flat.fieldErrors, locale) } },
      { status: 400 },
    );
  }

  const { email, ...rest } = parsed.data;
  const enquiry = await prisma.contactEnquiry.create({
    data: { ...rest, email: email || null, status: "new" },
  });

  return NextResponse.json({ id: enquiry.id }, { status: 201 });
}
