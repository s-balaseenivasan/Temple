import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-compatible auth instance (no Prisma/bcrypt) — only decodes the JWT to
// check role, never touches the database. See src/auth.config.ts for why this
// is split from the full src/auth.ts used everywhere else.
const { auth } = NextAuth(authConfig);

// PERM-000/PERM-001/FEAT-072: every /admin route requires an active admin session.
// Super-Admin-only sub-areas are additionally checked here as a first line of
// defense; the authoritative check still happens again in each API route handler
// (PERM-000 — never rely on middleware/UI alone for authorization).
const SUPER_ADMIN_ONLY_PREFIXES = [
  "/admin/users",
  "/admin/settings/security",
  "/admin/settings/payment-gateway",
  "/admin/audit-log",
];

// FEAT-071: an admin requesting/using a password reset is, by definition,
// not authenticated — these two routes must stay reachable the same way
// /admin/login already is, or the auth check below would redirect a locked-
// out admin straight back to the login page they're trying to escape.
const PUBLIC_ADMIN_PREFIXES = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      const loginUrl = new URL("/admin/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isSuperAdminOnly = SUPER_ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
    if (isSuperAdminOnly && req.auth.user.role !== "SuperAdmin") {
      return NextResponse.redirect(new URL("/admin?error=forbidden", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
