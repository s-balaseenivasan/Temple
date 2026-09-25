import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AlbumForm from "../album-form";
import PhotoManager from "../photo-manager";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = await prisma.galleryAlbum.findUnique({
    where: { id },
    include: { photos: { where: { deletedAt: null } } },
  });
  if (!album) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="admin-title">Edit Album</h1>
      <AlbumForm existing={{ ...album, date: album.date?.toISOString() ?? null }} />
      <h2 className="text-lg font-semibold text-primary">Photos</h2>
      <PhotoManager albumId={album.id} photos={album.photos} />
    </div>
  );
}
