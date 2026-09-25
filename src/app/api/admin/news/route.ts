import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { newsSchema } from "@/lib/validation/content";

// FEAT-013: authorId is auto-set from the session, never client-supplied.
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = newsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const news = await prisma.news.create({
    data: {
      ...parsed.data,
      authorId: session.user.id,
      status: "draft",
    },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "News", entityId: news.id },
  });

  return NextResponse.json(news, { status: 201 });
}
