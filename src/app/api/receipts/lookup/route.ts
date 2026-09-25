import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receiptLookupSchema } from "@/lib/validation/donation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Security review: receipt numbers are sequential (DON-YYYY-NNNNNN), so
// without a throttle someone who knows a donor's mobile number could walk
// the receipt sequence to find their donations. 20 lookups/hour per IP is
// far above any genuine donor's need.
const LOOKUP_RATE_LIMIT = 20;
const LOOKUP_RATE_WINDOW_MS = 60 * 60 * 1000;

// FEAT-045 / RULE-016: compound-key lookup — both mobile AND receiptNumber
// must match the same donation. Generic error either way, never revealing
// which field was wrong (anti-enumeration).
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(`receipt-lookup:${getClientIp(req)}`, LOOKUP_RATE_LIMIT, LOOKUP_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = receiptLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "No matching receipt found." }, { status: 404 });
  }

  const receipt = await prisma.receipt.findUnique({
    where: { receiptNumber: parsed.data.receiptNumber },
    include: { donation: true },
  });

  if (!receipt || receipt.donation.mobile !== parsed.data.mobile) {
    return NextResponse.json({ error: "No matching receipt found." }, { status: 404 });
  }

  return NextResponse.json({
    receiptId: receipt.id,
    receiptNumber: receipt.receiptNumber,
    amount: receipt.donation.amount,
    issuedAt: receipt.issuedAt,
  });
}
