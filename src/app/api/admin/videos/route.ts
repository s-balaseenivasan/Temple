import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { videoSchema } from "@/lib/validation/content";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = videoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const video = await prisma.video.create({ data: { ...parsed.data, status: "draft" } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "Video", entityId: video.id },
  });

  return NextResponse.json(video, { status: 201 });
}
