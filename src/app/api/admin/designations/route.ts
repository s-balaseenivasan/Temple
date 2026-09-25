import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { designationSchema } from "@/lib/validation/committee";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = designationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const designation = await prisma.designation.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "Designation", entityId: designation.id },
  });

  return NextResponse.json(designation, { status: 201 });
}
