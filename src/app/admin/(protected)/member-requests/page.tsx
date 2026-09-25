import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  registration: "New Registration",
  family_update: "Family Update",
  contact_update: "Contact Update",
  matrimony_update: "Matrimony Update",
};

export default async function AdminMemberRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const requests = await prisma.memberRequest.findMany({
    where: status ? { status: status as "new" | "in_review" | "completed" | "rejected" } : undefined,
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["new", "in_review", "completed", "rejected"];

  return (
    <div>
      <h1 className="admin-title mb-6">Pangaligal / Member Requests</h1>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/member-requests"
          className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${!status ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-primary"}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/member-requests?status=${s}`}
            className={`rounded-full px-3.5 py-1.5 font-medium capitalize transition-colors ${status === s ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-primary"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Pangali</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{r.pangaliName}</td>
                <td className="px-4 py-3 text-text-secondary">{REQUEST_TYPE_LABELS[r.requestType]}</td>
                <td className="px-4 py-3 text-text-secondary">{r.mobile}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-text-secondary">{r.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/member-requests/${r.id}`} className="admin-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No requests match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
