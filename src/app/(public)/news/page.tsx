import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import PageHeader from "@/components/page-header";
import NewsCard from "@/components/news-card";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

function excerptOf(text: string, max = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

// FEAT-003: only status='published' is ever shown to the public, sorted by publishedAt desc.
export default async function NewsListPage() {
  const [items, locale] = await Promise.all([
    prisma.news.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "கோவில் அலுவலகத்திலிருந்து" : "From the temple office"}
        title={locale === "ta" ? "செய்திகள் மற்றும் அறிவிப்புகள்" : "News & Announcements"}
        locale={locale}
      />
      <div className="page-container max-w-4xl py-12 sm:py-16">
        {items.length > 0 ? (
          <div className="divide-y divide-border border-y border-border">
            {items.map((n, i) => (
              <Reveal key={n.id} delayMs={Math.min(i, 5) * 60}>
                <NewsCard
                  href={`/news/${n.id}`}
                  title={pick(n.title_en, n.title_ta, locale)}
                  excerpt={excerptOf(pick(n.body_en, n.body_ta, locale))}
                  date={n.publishedAt}
                  locale={locale}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyNote langClass={langClass}>{locale === "ta" ? "இதுவரை செய்திகள் வெளியிடப்படவில்லை." : "No news published yet."}</EmptyNote>
        )}
      </div>
    </>
  );
}

function EmptyNote({ children, langClass }: { children: React.ReactNode; langClass: string }) {
  return <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>{children}</p>;
}
