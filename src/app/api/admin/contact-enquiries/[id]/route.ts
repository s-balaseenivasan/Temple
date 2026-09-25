import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { enquiryStatusSchema } from "@/lib/validation/settings";

// FEAT-026: new -> responded -> closed, reopening allowed but not required
// (blueprint's own wording) — so no transition-map restriction like the
// content state machines elsewhere; any status value is accepted as long as
// it's one of the three valid ones.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.contactEnquiry.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = enquiryStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.contactEnquiry.update({
    where: { id },
    data: { status: parsed.data.status, handledByAdminId: session.user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "ContactEnquiry",
      entityId: id,
      beforeJson: { status: before.status },
      afterJson: { status: updated.status },
    },
  });

  return NextResponse.json(updated);
}
