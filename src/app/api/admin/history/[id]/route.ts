import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { historyEntrySchema } from "@/lib/validation/settings";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["draft", "published"]) });
const reorderSchema = z.object({ sortOrder: z.coerce.number() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.historyTimelineEntry.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  if (body && typeof body === "object" && "status" in body && Object.keys(body).length === 1) {
    const parsedStatus = statusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json({ error: "validation_error", details: parsedStatus.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.historyTimelineEntry.update({ where: { id }, data: { status: parsedStatus.data.status } });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "HistoryTimelineEntry",
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: updated.status },
      },
    });
    return NextResponse.json(updated);
  }

  if (body && typeof body === "object" && "sortOrder" in body && Object.keys(body).length === 1) {
    const parsedReorder = reorderSchema.safeParse(body);
    if (!parsedReorder.success) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    const updated = await prisma.historyTimelineEntry.update({ where: { id }, data: { sortOrder: parsedReorder.data.sortOrder } });
    return NextResponse.json(updated);
  }

  const parsed = historyEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.historyTimelineEntry.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "HistoryTimelineEntry", entityId: id },
  });

  return NextResponse.json(updated);
}
