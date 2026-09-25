import { prisma } from "@/lib/prisma";
import { extractYouTubeId } from "@/lib/youtube";
import { getLocale, pick } from "@/lib/i18n";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-009: only status='published' shown; YouTube embeds only, no self-hosted video (brief §5).
export default async function VideoGalleryPage() {
  const [videos, locale] = await Promise.all([
    prisma.video.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil-display" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "காட்சிகள்" : "Watch"}
        title={locale === "ta" ? "காணொளிகள்" : "Video Gallery"}
        locale={locale}
      />
      <div className="page-container py-12 sm:py-16">
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
            {videos.map((v) => {
              const ytId = extractYouTubeId(v.videoUrl);
              const title = pick(v.title_en, v.title_ta, locale);
              return (
                <figure key={v.id}>
                  <div className="overflow-hidden rounded-2xl border border-border bg-ink">
                    {ytId ? (
                      <div className="aspect-video">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} title={title} className="h-full w-full" allowFullScreen />
                      </div>
                    ) : (
                      <div className={`flex aspect-video items-center justify-center bg-surface-muted text-sm text-text-secondary ${langClass}`}>
                        {locale === "ta" ? "காணொளி கிடைக்கவில்லை" : "Video unavailable"}
                      </div>
                    )}
                  </div>
                  <figcaption className={`mt-4 text-lg font-semibold leading-snug text-text-primary ${headingClass}`}>{title}</figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>
            {locale === "ta" ? "இதுவரை காணொளிகள் வெளியிடப்படவில்லை." : "No videos published yet."}
          </p>
        )}
      </div>
    </>
  );
}
