import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

export default async function AdminNewsListPage() {
  const items = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="News" actionHref="/admin/news/new" actionLabel="New News Item" />

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{n.title_en}</td>
                <td className="px-4 py-3 text-text-secondary">{n.author.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={n.status} />
                </td>
                <td className="px-4 py-3 text-text-secondary">{n.publishedAt ? n.publishedAt.toLocaleDateString("en-IN") : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/news/${n.id}`} className="admin-link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No news items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
