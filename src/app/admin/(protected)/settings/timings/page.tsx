import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";
import Link from "next/link";
import TimingsForm from "./timings-form";

export default async function AdminTimingsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });
  const timings = (settings?.timingsJson ?? {}) as {
    morning?: { open: string; close: string };
    evening?: { open: string; close: string };
    specialDayOverrides?: { date: string; open: string; close: string; note_en?: string; note_ta?: string }[];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="admin-title">Temple Timings</h1>
        <Link href="/admin/settings" className="text-sm text-secondary underline">
          ← Back to Settings
        </Link>
      </div>
      <TimingsForm initial={timings} />
    </div>
  );
}
