import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { siteSettingsSchema } from "@/lib/validation/settings";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

// FEAT-061: Temple Admin + Super Admin can edit core identity/contact info.
// Singleton — PUT only, no create/delete route exists at all.
export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const before = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });

  const updated = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      templeName_en: data.templeName_en,
      templeName_ta: data.templeName_ta || null,
      addressLine_en: data.addressLine_en,
      addressLine_ta: data.addressLine_ta || null,
      phone: data.phone ?? "",
      email: data.email || null,
      mapLatitude: data.mapLatitude === "" || data.mapLatitude === undefined ? null : data.mapLatitude,
      mapLongitude: data.mapLongitude === "" || data.mapLongitude === undefined ? null : data.mapLongitude,
      heroImage: data.heroImage || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "SiteSettings",
      entityId: SITE_SETTINGS_ID,
      beforeJson: before ?? undefined,
      afterJson: updated,
    },
  });

  return NextResponse.json(updated);
}
