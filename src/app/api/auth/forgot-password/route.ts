import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation/password-reset";
import { generateResetToken } from "@/lib/password-reset";
import { getEmailProvider } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const FORGOT_PASSWORD_RATE_LIMIT = 5;
const FORGOT_PASSWORD_RATE_WINDOW_MS = 60 * 60 * 1000;

// FEAT-071: "Same response regardless of whether email exists (avoid
// enumeration)" — every code path below returns the exact same 200 with the
// same generic body, whether the email exists, is inactive, or a completely
// unknown address. The only observable difference an attacker could use is
// timing, which is out of scope for this pass (same as every other
// anti-enumeration endpoint already built in this project, e.g. FEAT-069's
// login and FEAT-045's receipt lookup — none of them defend against timing
// attacks either).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_RATE_LIMIT, FORGOT_PASSWORD_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  const genericResponse = NextResponse.json({ message: "If that email exists, a reset link has been sent." });

  if (!parsed.success) return genericResponse;

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  // Deactivated account: silently ignore per the blueprint's own recommended
  // edge-case handling ("deactivated ≠ recoverable").
  if (!admin || admin.status !== "active") return genericResponse;

  const { token, tokenHash, expiresAt } = generateResetToken();
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password/${token}`;

  await getEmailProvider().sendEmail({
    to: admin.email,
    subject: "Reset your Temple Admin password",
    html: `<p>A password reset was requested for your Temple Admin account.</p><p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p><p>If you did not request this, you can safely ignore this email.</p>`,
    text: `A password reset was requested for your Temple Admin account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
  });

  return genericResponse;
}
