import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebarShell from "@/components/admin-sidebar-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const isSuperAdmin = session.user.role === "SuperAdmin";

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarShell isSuperAdmin={isSuperAdmin} userName={session.user.name ?? session.user.email ?? "Admin"} userRole={session.user.role} />
      {/* md:ml-64 offsets for the fixed sidebar (w-64) — the sidebar never
          participates in page scroll, so there's exactly one scroll region:
          this main content, in normal document flow. */}
      <main className="min-w-0 p-4 md:ml-64 md:p-8">{children}</main>
    </div>
  );
}
