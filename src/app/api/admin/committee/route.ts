import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { committeeMemberSchema } from "@/lib/validation/committee";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = committeeMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, ...rest } = parsed.data;
  const member = await prisma.committeeMember.create({
    data: { ...rest, email: email || null, status: "active" },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "CommitteeMember", entityId: member.id },
  });

  return NextResponse.json(member, { status: 201 });
}
