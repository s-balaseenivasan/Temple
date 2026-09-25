import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getLocale, pick, isFallback } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrnamentalDivider } from "@/components/decorative";

export const dynamic = "force-dynamic";

// FEAT-004: 404 for unpublished/nonexistent — never a silent redirect (RULE-024).
export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [news, locale] = await Promise.all([prisma.news.findUnique({ where: { id } }), getLocale()]);
  if (!news || news.status !== "published") notFound();

  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <article className="page-container max-w-3xl py-12 sm:py-16">
      <Link href="/news" className={`link-arrow ${langClass}`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {locale === "ta" ? "செய்திகளுக்குத் திரும்பு" : "Back to News"}
      </Link>

      <header className="mt-10 border-b border-border pb-8">
        {news.publishedAt && (
          <p className="kicker">
            <time dateTime={news.publishedAt.toISOString()}>
              {news.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </time>
          </p>
        )}
        <h1 className={`mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-5xl ${headingClass}`}>
          {pick(news.title_en, news.title_ta, locale)}
        </h1>
      </header>

      <div className={`mt-8 whitespace-pre-wrap text-lg leading-relaxed text-text-primary ${langClass}`}>{pick(news.body_en, news.body_ta, locale)}</div>
      {isFallback(news.title_ta, locale) && (
        <p className="mt-6 text-xs text-text-secondary">{locale === "ta" ? "தமிழில் கிடைக்கவில்லை — ஆங்கிலத்தில் காட்டப்படுகிறது." : ""}</p>
      )}

      <OrnamentalDivider className="mt-14" />
    </article>
  );
}
