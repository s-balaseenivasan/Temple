import { randomBytes, createHash } from "node:crypto";

// FEAT-071: 1-hour expiry — a standard, reasonable default (blueprint marks
// the whole feature ASSUMPTION, not a specified duration).
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
