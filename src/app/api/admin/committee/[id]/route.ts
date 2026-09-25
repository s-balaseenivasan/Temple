import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { committeeMemberSchema } from "@/lib/validation/committee";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["active", "inactive"]) });
const reorderSchema = z.object({ displayOrder: z.coerce.number() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.committeeMember.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  // Status-only toggle (RULE-026: deactivate, never delete).
  if (body && typeof body === "object" && "status" in body && Object.keys(body).length === 1) {
    const parsedStatus = statusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json({ error: "validation_error", details: parsedStatus.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.committeeMember.update({ where: { id }, data: { status: parsedStatus.data.status } });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "CommitteeMember",
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: updated.status },
      },
    });
    return NextResponse.json(updated);
  }

  // Reorder-only.
  if (body && typeof body === "object" && "displayOrder" in body && Object.keys(body).length === 1) {
    const parsedReorder = reorderSchema.safeParse(body);
    if (!parsedReorder.success) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    const updated = await prisma.committeeMember.update({ where: { id }, data: { displayOrder: parsedReorder.data.displayOrder } });
    return NextResponse.json(updated);
  }

  // Full field update.
  const parsed = committeeMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, ...rest } = parsed.data;
  const updated = await prisma.committeeMember.update({ where: { id }, data: { ...rest, email: email || null } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "CommitteeMember", entityId: id },
  });

  return NextResponse.json(updated);
}
