import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";
import Link from "next/link";
import SettingsForm from "./settings-form";
import Toggle80gForm from "./toggle-80g-form";

// FEAT-061/063: general identity/contact settings (Temple Admin + Super
// Admin) plus the 80G toggle, which is Super-Admin-only and rendered
// conditionally — the API route also enforces this server-side (PERM-000),
// this conditional render is only the UI-layer convenience on top of that.
export default async function AdminSettingsPage() {
  // Sequential, not Promise.all — the local `prisma dev` database was found
  // (via real testing, see IMPLEMENTATION_ENVIRONMENT.md) to be unreliable
  // under even 2 truly-concurrent queries from this adapter's connection pool.
  const session = await auth();
  const settings = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });

  if (!settings) {
    return <p className="text-error">SiteSettings singleton row is missing — this should never happen outside a broken seed.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="admin-title">Site Settings</h1>
        <Link href="/admin/settings/timings" className="btn btn-outline btn-sm">
          Edit Timings
        </Link>
      </div>

      <SettingsForm
        settings={{
          templeName_en: settings.templeName_en,
          templeName_ta: settings.templeName_ta,
          addressLine_en: settings.addressLine_en,
          addressLine_ta: settings.addressLine_ta,
          phone: settings.phone,
          email: settings.email,
          mapLatitude: settings.mapLatitude?.toString() ?? null,
          mapLongitude: settings.mapLongitude?.toString() ?? null,
          heroImage: settings.heroImage,
        }}
      />

      {session?.user.role === "SuperAdmin" && (
        <Toggle80gForm is80GRegistered={settings.is80GRegistered} registration80GNumber={settings.registration80GNumber} />
      )}
    </div>
  );
}
