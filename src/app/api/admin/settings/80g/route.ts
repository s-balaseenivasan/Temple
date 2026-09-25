import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import { toggle80gSchema } from "@/lib/validation/settings";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

// FEAT-063: Super-Admin-only — financial/compliance-sensitive (brief §1).
// Temple Admin gets 403, enforced server-side per PERM-000, not just hidden
// in the UI (requireSuperAdmin, not requireAdmin).
export async function PATCH(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = toggle80gSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });

  const updated = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      is80GRegistered: parsed.data.is80GRegistered,
      registration80GNumber: parsed.data.registration80GNumber || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "SiteSettings",
      entityId: SITE_SETTINGS_ID,
      beforeJson: before
        ? { is80GRegistered: before.is80GRegistered, registration80GNumber: before.registration80GNumber }
        : undefined,
      afterJson: { is80GRegistered: updated.is80GRegistered, registration80GNumber: updated.registration80GNumber },
    },
  });

  return NextResponse.json(updated);
}
