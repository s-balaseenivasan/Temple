import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PlaceholderTile } from "@/components/decorative";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

export default async function GalleryListPage() {
  const [albums, locale] = await Promise.all([
    prisma.galleryAlbum.findMany({ where: { deletedAt: null }, orderBy: { date: "desc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil-display" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "நினைவுகள்" : "Moments"}
        title={locale === "ta" ? "புகைப்படத் தொகுப்பு" : "Gallery"}
        locale={locale}
      />
      <div className="page-container py-12 sm:py-16">
        {albums.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => (
              <Reveal key={a.id} delayMs={(i % 6) * 50}>
                <Link href={`/gallery/${a.id}`} className="group block">
                  <div className="overflow-hidden rounded-2xl border border-border">
                    {a.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.coverImage}
                        alt={pick(a.title_en, a.title_ta, locale)}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <PlaceholderTile className="aspect-[4/3] w-full" />
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <p
                      className={`text-lg font-semibold leading-snug text-text-primary underline-offset-4 group-hover:text-primary group-hover:underline ${headingClass}`}
                    >
                      {pick(a.title_en, a.title_ta, locale)}
                    </p>
                    {a.date && (
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {a.date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" })}
                      </span>
                    )}
                  </div>
                  {a.category && <p className="mt-1 text-sm text-text-secondary">{a.category}</p>}
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>
            {locale === "ta" ? "இதுவரை புகைப்பட தொகுப்புகள் இல்லை." : "No albums published yet."}
          </p>
        )}
      </div>
    </>
  );
}
