import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminPageHeader from "@/components/admin-page-header";
import AdminTableCard from "@/components/admin-table-card";

export default async function AdminGalleryListPage() {
  const albums = await prisma.galleryAlbum.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="Gallery Albums" actionHref="/admin/gallery/new" actionLabel="New Album" />

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Photos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {albums.map((a) => (
              <tr key={a.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{a.title_en}</td>
                <td className="px-4 py-3 text-text-secondary">{a.category ?? "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{a._count.photos}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/gallery/${a.id}`} className="admin-link">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
            {albums.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  No albums yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
