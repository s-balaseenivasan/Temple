import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { deitySchema } from "@/lib/validation/deity";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = deitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const deity = await prisma.deity.create({
    data: { ...parsed.data, status: "active" },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "Deity", entityId: deity.id },
  });

  return NextResponse.json(deity, { status: 201 });
}
