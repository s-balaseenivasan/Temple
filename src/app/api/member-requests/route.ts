import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberRequestSchema } from "@/lib/validation/member-request";
import { localizeFieldErrors } from "@/lib/validation/messages";
import { getLocale } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Hardening pass: 5 requests per hour per IP — this is a low-volume,
// admin-reviewed intake form (not a payment flow), so a tighter window than
// the donation endpoint is appropriate (ASSUMPTION, same category as
// FEAT-074's threshold).
const MEMBER_REQUEST_RATE_LIMIT = 5;
const MEMBER_REQUEST_RATE_WINDOW_MS = 60 * 60 * 1000;

// FEAT-081: public visitor create-only. No login required (admin-managed
// model per the stakeholder's explicit decision — see _CONTEXT_BRIEF.md §11.6).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`member-request:${ip}`, MEMBER_REQUEST_RATE_LIMIT, MEMBER_REQUEST_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = memberRequestSchema.safeParse(body);
  if (!parsed.success) {
    const locale = await getLocale();
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "validation_error", details: { fieldErrors: localizeFieldErrors(flat.fieldErrors, locale) } },
      { status: 400 },
    );
  }

  const { email, lineageBranch, ...rest } = parsed.data;
  const request = await prisma.memberRequest.create({
    data: { ...rest, email: email || null, lineageBranch: lineageBranch || null, status: "new" },
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
