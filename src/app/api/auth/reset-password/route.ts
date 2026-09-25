import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation/password-reset";
import { hashResetToken } from "@/lib/password-reset";
import { localizeFieldErrors } from "@/lib/validation/messages";
import { getLocale } from "@/lib/i18n";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RESET_PASSWORD_RATE_LIMIT = 10;
const RESET_PASSWORD_RATE_WINDOW_MS = 60 * 60 * 1000;

// FEAT-071: consumes a reset token. "Expired/invalid token -> clear error,
// request new link" — token lookup errors are distinguishable from
// validation errors (unlike forgot-password, there's no enumeration risk
// here: the token itself is the secret, not the email).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`reset-password:${ip}`, RESET_PASSWORD_RATE_LIMIT, RESET_PASSWORD_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const locale = await getLocale();
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "validation_error", details: { fieldErrors: localizeFieldErrors(flat.fieldErrors, locale) } },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const admin = await prisma.adminUser.findFirst({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
  });

  if (!admin) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      // A successful reset is a legitimate, verified way back into the
      // account — also clears any standing lockout (FEAT-074) rather than
      // leaving the admin newly-passworded but still locked out.
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "PASSWORD_RESET", entityType: "AdminUser", entityId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
