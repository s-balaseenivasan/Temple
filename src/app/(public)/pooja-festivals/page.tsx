import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FestivalTradition = evergreen descriptions, distinct from date-specific
// Event instances (no hard FK between them, per _CONTEXT_BRIEF.md §11.3).
export default async function PoojaFestivalsPage() {
  const [festivals, locale] = await Promise.all([
    prisma.festivalTradition.findMany({ where: { status: "active" }, orderBy: { sortOrder: "asc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "வழிபாடு" : "Worship"}
        title={locale === "ta" ? "பூஜைகள் மற்றும் திருவிழாக்கள்" : "Pooja & Festivals"}
        subtitle={
          locale === "ta"
            ? "ஆண்டுதோறும் கொண்டாடப்படும் பாரம்பரிய வழிபாடுகள்."
            : "The traditions observed at the temple through the year."
        }
        locale={locale}
      />
      <div className="page-container max-w-4xl py-12 sm:py-16">
        <ol className="border-t border-border">
          {festivals.map((f, i) => (
            <li key={f.id} className="grid gap-3 border-b border-border py-8 sm:grid-cols-[4rem_1fr] sm:gap-8">
              <span className="font-display text-2xl font-semibold tabular-nums text-secondary">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className={`text-2xl font-semibold text-text-primary ${headingClass}`}>{pick(f.name_en, f.name_ta, locale)}</h2>
                {(f.description_en || f.description_ta) && (
                  <p className={`mt-3 text-pretty leading-relaxed text-text-secondary ${langClass}`}>{pick(f.description_en ?? "", f.description_ta, locale)}</p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-surface-muted/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className={`text-text-primary ${langClass}`}>
            {locale === "ta" ? "இந்த ஆண்டின் குறிப்பிட்ட தேதிகளுக்கு, நிகழ்வுகள் பக்கத்தைப் பார்க்கவும்." : "Looking for this year's specific dates?"}
          </p>
          <Link href="/events" className={`btn btn-outline shrink-0 ${langClass}`}>
            {locale === "ta" ? "நிகழ்வுகள்" : "See the Events calendar"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
