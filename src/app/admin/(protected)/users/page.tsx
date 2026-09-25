import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserManager from "./user-manager";

// PERM-000: defense-in-depth — the middleware already blocks this route for
// non-Super-Admins, but this page-level check is what actually matters if
// the middleware matcher/prefix list is ever misconfigured.
export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user.role !== "SuperAdmin") redirect("/admin?error=forbidden");

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true, lastLoginAt: true },
  });

  const activeSuperAdminCount = users.filter((u) => u.role === "SuperAdmin" && u.status === "active").length;

  return (
    <div className="max-w-3xl">
      <h1 className="admin-title mb-6">Admin Users</h1>
      <UserManager
        initialUsers={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))}
        activeSuperAdminCount={activeSuperAdminCount}
      />
    </div>
  );
}
