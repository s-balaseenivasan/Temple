import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { galleryAlbumSchema } from "@/lib/validation/gallery";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = galleryAlbumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, ...rest } = parsed.data;
  const updated = await prisma.galleryAlbum.update({ where: { id }, data: { ...rest, date: date ? new Date(date) : null } });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "GalleryAlbum", entityId: id },
  });

  return NextResponse.json(updated);
}

// RULE-DM-002: soft-delete only — sets deletedAt, never a hard DELETE.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const updated = await prisma.galleryAlbum.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "DELETE", entityType: "GalleryAlbum", entityId: id },
  });

  return NextResponse.json(updated);
}
