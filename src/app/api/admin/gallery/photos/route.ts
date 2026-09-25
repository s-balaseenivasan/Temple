import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { galleryPhotoSchema } from "@/lib/validation/gallery";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = galleryPhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const album = await prisma.galleryAlbum.findUnique({ where: { id: parsed.data.albumId } });
  if (!album) return NextResponse.json({ error: "invalid_album" }, { status: 400 });

  const photo = await prisma.galleryPhoto.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "GalleryPhoto", entityId: photo.id },
  });

  return NextResponse.json(photo, { status: 201 });
}
