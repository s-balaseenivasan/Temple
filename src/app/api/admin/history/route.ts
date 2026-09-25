import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { historyEntrySchema } from "@/lib/validation/settings";

// DERIVED admin CRUD for HistoryTimelineEntry — see FEAT-002's data note in
// FEATURE_CATALOG.md ("admin-orderable") and messages.ts's comment on why
// this file's messages stay in English (admin CMS, RULE-017 exemption).
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = historyEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.historyTimelineEntry.create({ data: { ...parsed.data, status: "draft" } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "HistoryTimelineEntry", entityId: entry.id },
  });

  return NextResponse.json(entry, { status: 201 });
}
