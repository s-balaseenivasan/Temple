import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

const CATEGORY_LABELS: Record<string, string> = {
  registration_info: "Registration Info",
  bylaws: "Bylaws",
  agm_report: "AGM Report",
  annual_activity_report: "Annual Activity Report",
  public_notice: "Public Notice",
};

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });

  return (
    <div>
      <AdminPageHeader title="Documents & Transparency" actionHref="/admin/documents/new" actionLabel="New Document" />

      <p className="mb-6 rounded-xl border border-gold bg-gold-light/15 p-3 text-sm text-primary">
        ⚠️ Do not upload internal, personal-member, or legally-sensitive documents here — this repository is
        public. Only registration info, approved bylaws, AGM-approved reports, annual activity reports, and
        public notices belong here.
      </p>

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{d.title_en}</td>
                <td className="px-4 py-3 text-text-secondary">{CATEGORY_LABELS[d.category]}</td>
                <td className="px-4 py-3 text-text-secondary">{d.publishedDate.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/documents/${d.id}`} className="admin-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
