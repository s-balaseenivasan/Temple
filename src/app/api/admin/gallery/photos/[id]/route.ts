import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const updateSchema = z.object({
  caption_en: z.string().trim().optional(),
  caption_ta: z.string().trim().optional(),
  sortOrder: z.coerce.number().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.galleryPhoto.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "GalleryPhoto", entityId: id },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const updated = await prisma.galleryPhoto.update({ where: { id }, data: { deletedAt: new Date() } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "DELETE", entityType: "GalleryPhoto", entityId: id },
  });

  return NextResponse.json(updated);
}
