import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VideoForm from "../video-form";

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Video</h1>
      <VideoForm existing={video} />
    </div>
  );
}
