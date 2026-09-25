import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const updateSchema = z.object({
  name_en: z.string().trim().min(1).optional(),
  name_ta: z.string().trim().optional(),
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

  const updated = await prisma.eventCategory.update({ where: { id }, data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "EventCategory", entityId: id },
  });

  return NextResponse.json(updated);
}

// RULE-032: cannot delete a category referenced by any Event.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const referenced = await prisma.event.findFirst({ where: { categoryId: id } });
  if (referenced) {
    return NextResponse.json(
      { error: "in_use", detail: "This category is used by an existing event — deactivate it instead of deleting." },
      { status: 409 },
    );
  }

  await prisma.eventCategory.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "DELETE", entityType: "EventCategory", entityId: id },
  });

  return NextResponse.json({ ok: true });
}
