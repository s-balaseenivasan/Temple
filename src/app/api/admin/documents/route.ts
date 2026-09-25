import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { documentSchema } from "@/lib/validation/document";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { publishedDate, ...rest } = parsed.data;
  const document = await prisma.document.create({
    data: { ...rest, publishedDate: new Date(publishedDate), status: "draft" },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "Document", entityId: document.id },
  });

  return NextResponse.json(document, { status: 201 });
}
