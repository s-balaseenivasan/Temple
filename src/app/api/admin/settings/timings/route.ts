import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { timingsSchema } from "@/lib/validation/settings";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

// FEAT-062: standard morning/evening timings + a list of dated overrides,
// stored as one JSON blob on SiteSettings.timingsJson (per DATA_MODEL.md
// ENT-01's documented shape). Duplicate-date validation happens in the zod
// schema itself (`.refine()`), not here.
export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = timingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });

  const updated = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: { timingsJson: parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "SiteSettings",
      entityId: SITE_SETTINGS_ID,
      beforeJson: before ? { timingsJson: before.timingsJson } : undefined,
      afterJson: { timingsJson: updated.timingsJson },
    },
  });

  return NextResponse.json(updated);
}
