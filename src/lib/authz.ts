import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * PERM-000 (ROLES_AND_PERMISSIONS.md): every mutating/admin API route must
 * re-derive the caller's role from the server-side session and check it here —
 * never trust a role value supplied by the client, and never rely on the
 * middleware/UI check alone.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  return { session } as const;
}

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if ("error" in result) return result;
  if (result.session.user.role !== "SuperAdmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return result;
}
