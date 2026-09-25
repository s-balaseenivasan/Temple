import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LightboxGrid from "./lightbox-grid";

export const dynamic = "force-dynamic";

export default async function GalleryAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [album, locale] = await Promise.all([
    prisma.galleryAlbum.findUnique({
      where: { id },
      include: { photos: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
    }),
    getLocale(),
  ]);
  if (!album || album.deletedAt) notFound();
  const langClass = locale === "ta" ? "font-tamil" : "";

  return (
    <div className="page-container py-12 sm:py-16">
      <Link href="/gallery" className={`link-arrow ${langClass}`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {locale === "ta" ? "தொகுப்புகளுக்குத் திரும்பு" : "Back to Gallery"}
      </Link>
      <header className="mb-10 mt-8 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {album.date && (
            <p className="kicker">{album.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p>
          )}
          <h1
            className={`mt-3 text-balance text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl ${locale === "ta" ? "font-tamil" : "font-display"}`}
          >
            {pick(album.title_en, album.title_ta, locale)}
          </h1>
          {(album.description_en || album.description_ta) && (
            <p className={`mt-4 max-w-2xl text-text-secondary ${langClass}`}>{pick(album.description_en ?? "", album.description_ta, locale)}</p>
          )}
        </div>
        <p className={`shrink-0 text-sm font-medium text-text-secondary ${langClass}`}>
          {album.photos.length} {locale === "ta" ? "புகைப்படங்கள்" : album.photos.length === 1 ? "photo" : "photos"}
        </p>
      </header>

      <LightboxGrid
        photos={album.photos.map((p) => ({ id: p.id, imageUrl: p.imageUrl, caption_en: pick(p.caption_en ?? "", p.caption_ta, locale) || null }))}
      />
    </div>
  );
}
