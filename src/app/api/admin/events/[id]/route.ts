import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { eventSchema } from "@/lib/validation/content";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["draft", "published", "archived", "cancelled"]) });

// §7.2-style state machine, extended with `cancelled` (DATA_MODEL ENT-07,
// ASSUMPTION): a scheduled event that's called off is marked cancelled
// (visible, transparent) rather than silently hidden via archive.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["published", "cancelled"],
  published: ["draft", "archived", "cancelled"],
  archived: ["draft"],
  cancelled: ["draft"],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.event.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  if (body && typeof body === "object" && "status" in body && Object.keys(body).length === 1) {
    const parsedStatus = statusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json({ error: "validation_error", details: parsedStatus.error.flatten() }, { status: 400 });
    }
    const nextStatus = parsedStatus.data.status;
    const allowed = ALLOWED_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: "invalid_transition", detail: `Cannot move from '${before.status}' to '${nextStatus}'` },
        { status: 409 },
      );
    }

    const updated = await prisma.event.update({ where: { id }, data: { status: nextStatus } });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "Event",
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: updated.status },
      },
    });
    return NextResponse.json(updated);
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { eventDate, ...rest } = parsed.data;
  const updated = await prisma.event.update({ where: { id }, data: { ...rest, eventDate: new Date(eventDate) } });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "Event", entityId: id },
  });

  return NextResponse.json(updated);
}
