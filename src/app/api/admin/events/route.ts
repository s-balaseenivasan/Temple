import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { eventSchema } from "@/lib/validation/content";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { eventDate, ...rest } = parsed.data;
  const event = await prisma.event.create({
    data: { ...rest, eventDate: new Date(eventDate), status: "draft" },
  });

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "Event", entityId: event.id },
  });

  return NextResponse.json(event, { status: 201 });
}
