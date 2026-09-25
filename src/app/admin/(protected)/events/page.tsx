import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

export default async function AdminEventsListPage() {
  const items = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="admin-title">Events</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/event-categories"
            className="btn btn-outline btn-sm"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/events/new"
            className="btn btn-primary btn-sm"
          >
            + New Event
          </Link>
        </div>
      </div>

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{e.name_en}</td>
                <td className="px-4 py-3 text-text-secondary">{e.category.name_en}</td>
                <td className="px-4 py-3 text-text-secondary">{e.eventDate.toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${e.id}`} className="admin-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
