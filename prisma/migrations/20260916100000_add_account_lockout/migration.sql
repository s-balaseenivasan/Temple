-- FEAT-074: account lockout after repeated failed login attempts.
ALTER TABLE "admin_users" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "admin_users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
