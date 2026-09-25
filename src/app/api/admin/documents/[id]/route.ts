import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { documentSchema } from "@/lib/validation/document";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["draft", "published"]) });

// RULE-043: Document draft/published — simpler 2-state lifecycle than
// News/Event's 3-4 state machine, no archive state needed.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const before = await prisma.document.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  if (body && typeof body === "object" && "status" in body && Object.keys(body).length === 1) {
    const parsedStatus = statusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json({ error: "validation_error", details: parsedStatus.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.document.update({ where: { id }, data: { status: parsedStatus.data.status } });
    // RULE-DM-004: publish/unpublish audited distinctly from a generic UPDATE
    // — a Document going public is a transparency-sensitive event.
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "Document",
        entityId: id,
        beforeJson: { status: before.status },
        afterJson: { status: updated.status },
      },
    });
    return NextResponse.json(updated);
  }

  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { publishedDate, ...rest } = parsed.data;
  const updated = await prisma.document.update({ where: { id }, data: { ...rest, publishedDate: new Date(publishedDate) } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "UPDATE", entityType: "Document", entityId: id },
  });

  return NextResponse.json(updated);
}
