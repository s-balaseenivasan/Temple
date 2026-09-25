import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible base config — no providers, no Prisma import — so this file
 * can be safely used by `proxy.ts` (Edge Runtime). The full config with
 * the Credentials provider (which needs Prisma/bcrypt, both Node-only) lives
 * in `src/auth.ts` and is used everywhere else (API routes, server components).
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/admin/login",
  },
  // Production-readiness fix, found while verifying the CSP addition in a
  // real `next build && next start` run (unrelated to CSP itself): without
  // this, Auth.js v5 refuses any request whose Host header isn't an
  // explicitly-trusted origin — correct default behavior to prevent Host-
  // header-based callback-URL injection, but it also means admin login is
  // completely broken outside of `next dev` (which trusts localhost
  // automatically) unless something tells it what to trust. Auth.js's own
  // guidance for a self-hosted deployment (not Vercel, which sets this
  // automatically) is `trustHost: true` — this is only as safe as the
  // reverse proxy in front of the app actually validating/setting the Host
  // header correctly before the request reaches Next.js, the same
  // documented assumption already made for rate-limiting's `x-forwarded-for`
  // trust in src/lib/rate-limit.ts. Re-verify this against whatever hosting
  // is actually chosen, same as that other flag.
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SuperAdmin" | "TempleAdmin";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
