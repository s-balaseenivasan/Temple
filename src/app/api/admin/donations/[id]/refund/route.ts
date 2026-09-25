import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import { z } from "zod";

const bodySchema = z.object({ reason: z.string().trim().min(1).max(500) });

// FEAT-051 / PERM-012: refund is Super-Admin-only (moves real money back out).
// RULE-022: never voids/deletes the original Receipt — it stays historically
// accurate; only Donation.status changes.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // §7.1 forbidden transitions: only success -> refunded is allowed.
  if (donation.status !== "success") {
    return NextResponse.json({ error: "invalid_transition", detail: `Cannot refund from status '${donation.status}'` }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.donation.update({ where: { id }, data: { status: "refunded" } }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "Donation",
        entityId: id,
        beforeJson: { status: "success" },
        afterJson: { status: "refunded", reason: parsed.data.reason },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "refunded" });
}
