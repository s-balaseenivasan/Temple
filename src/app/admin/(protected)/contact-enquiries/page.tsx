import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

const ENQUIRER_LABELS: Record<string, string> = { pangali: "Pangali", bhaktar: "Bhaktar" };

// FEAT-025: sorted by createdAt desc, new items visually distinguished.
export default async function AdminContactEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const enquiries = await prisma.contactEnquiry.findMany({
    where: { deletedAt: null, ...(status ? { status: status as "new" | "responded" | "closed" } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["new", "responded", "closed"];

  return (
    <div>
      <h1 className="admin-title mb-6">Contact Enquiries</h1>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/contact-enquiries"
          className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${!status ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-primary"}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/contact-enquiries?status=${s}`}
            className={`rounded-full px-3.5 py-1.5 font-medium capitalize transition-colors ${status === s ? "bg-primary text-white" : "border border-border text-text-secondary hover:border-primary hover:text-primary"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className={`px-4 py-3 text-text-primary ${e.status === "new" ? "font-semibold" : "font-medium"}`}>{e.name}</td>
                <td className="px-4 py-3 text-text-secondary">{ENQUIRER_LABELS[e.enquirerType]}</td>
                <td className="px-4 py-3 text-text-secondary">{e.mobile}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3 text-text-secondary">{e.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/contact-enquiries/${e.id}`} className="admin-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No enquiries match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
