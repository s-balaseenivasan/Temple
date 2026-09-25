-- FEAT-071: password reset (SHA-256 hash of the reset token, never the raw token).
ALTER TABLE "admin_users" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);
