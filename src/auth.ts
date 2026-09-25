import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// FEAT-074: lock an account for 15 minutes after 5 consecutive failed
// attempts — mirrors RULE-020's existing 15-minute window elsewhere in this
// app rather than inventing a new arbitrary constant.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Session revalidation (security review): the JWT alone would keep a
    // deactivated or demoted admin fully authorised for the rest of its
    // 8-hour lifetime. This Node-side instance (used by every API route via
    // requireAdmin() and by every admin page) re-reads the account on each
    // auth() call: an inactive/deleted account gets `null` (session dropped),
    // and the role always reflects the database, not the role at sign-in.
    // The Edge proxy keeps the DB-free config — it's only a first line.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.user) return token; // just verified by authorize() below
      const id = typeof token.id === "string" ? token.id : null;
      if (!id) return null;
      const admin = await prisma.adminUser.findUnique({
        where: { id },
        select: { status: true, role: true },
      });
      if (!admin || admin.status !== "active") return null;
      token.role = admin.role;
      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // RULE-SEC / FEAT-069: never reveal whether the email exists, the account is
      // deactivated, or locked out — every rejection path below returns the same
      // `null` result, which NextAuth surfaces to the client as one generic
      // "invalid credentials" error (avoids account enumeration AND avoids telling
      // an attacker their brute-force attempt tripped the lockout).
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) return null;
        if (admin.status !== "active") return null;
        if (admin.lockedUntil && admin.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
          // Atomic DB-level increment, not a read-modify-write of the value
          // already in hand — NextAuth was found (via real Playwright
          // testing) to sometimes issue two concurrent `authorize()` calls
          // for a single credentials attempt (observed on the first
          // submission of a fresh session, likely an internal CSRF-retry).
          // A naive "read admin.failedLoginAttempts, +1, write" pattern lost
          // an increment whenever that happened; `increment: 1` is race-safe
          // regardless of how many calls land concurrently.
          const updated = await prisma.adminUser.update({
            where: { id: admin.id },
            data: { failedLoginAttempts: { increment: 1 } },
          });
          if (updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            await prisma.adminUser.update({
              where: { id: admin.id },
              data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
            });
            await prisma.auditLog.create({
              data: {
                actorId: null, // system-triggered (FEAT-073: null actor for system actions)
                action: "LOGIN_LOCKED",
                entityType: "AdminUser",
                entityId: admin.id,
                afterJson: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() },
              },
            });
          }
          return null;
        }

        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
        });
        await prisma.auditLog.create({
          data: {
            actorId: admin.id,
            action: "LOGIN",
            entityType: "AdminUser",
            entityId: admin.id,
          },
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      },
    }),
  ],
});
