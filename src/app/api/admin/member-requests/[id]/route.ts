import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["new", "in_review", "completed", "rejected"]).optional(),
  adminNotes: z.string().trim().optional(),
});

// RULE-040: status flow mirrors ContactEnquiry's pattern — new -> in_review -> completed/rejected.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["in_review", "rejected"],
  in_review: ["completed", "rejected", "new"],
  completed: [],
  rejected: ["new"],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.memberRequest.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.status) {
    const allowed = ALLOWED_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: "invalid_transition", detail: `Cannot move from '${before.status}' to '${parsed.data.status}'` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.memberRequest.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes } : {}),
      handledByAdminId: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "MemberRequest",
      entityId: id,
      beforeJson: { status: before.status },
      afterJson: { status: updated.status },
    },
  });

  return NextResponse.json(updated);
}
