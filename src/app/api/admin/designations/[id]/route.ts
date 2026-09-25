import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const updateSchema = z.object({
  name_en: z.string().trim().min(1).optional(),
  name_ta: z.string().trim().optional(),
  sortOrder: z.coerce.number().optional(),
  active: z.coerce.boolean().optional(),
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

  const updated = await prisma.designation.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "Designation", entityId: id },
  });

  return NextResponse.json(updated);
}

// RULE-025: cannot delete a Designation while any CommitteeMember references it.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const referenced = await prisma.committeeMember.findFirst({ where: { designationId: id } });
  if (referenced) {
    return NextResponse.json(
      { error: "in_use", detail: "This designation is assigned to a committee member — reassign or deactivate first." },
      { status: 409 },
    );
  }

  await prisma.designation.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "DELETE", entityType: "Designation", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
