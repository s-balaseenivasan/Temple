import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { galleryAlbumSchema } from "@/lib/validation/gallery";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = galleryAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, ...rest } = parsed.data;
  const album = await prisma.galleryAlbum.create({
    data: { ...rest, date: date ? new Date(date) : null },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "GalleryAlbum", entityId: album.id },
  });

  return NextResponse.json(album, { status: 201 });
}
