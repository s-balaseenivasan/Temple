import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

export default async function AdminHistoryListPage() {
  const entries = await prisma.historyTimelineEntry.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <AdminPageHeader title="History Timeline" actionHref="/admin/history/new" actionLabel="New Entry" />

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{e.year}</td>
                <td className="px-4 py-3 text-text-secondary">{e.title_en}</td>
                <td className="px-4 py-3 text-text-secondary">{e.sortOrder}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/history/${e.id}`} className="admin-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No timeline entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
