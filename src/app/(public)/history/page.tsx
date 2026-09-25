import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-002: narrative intro from SiteSettings + an ordered, published-only
// HistoryTimelineEntry list.
export default async function HistoryPage() {
  const settings = await prisma.siteSettings.findFirst();
  const entries = await prisma.historyTimelineEntry.findMany({
    where: { status: "published" },
    orderBy: { sortOrder: "asc" },
  });
  const locale = await getLocale();
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "எங்கள் பாரம்பரியம்" : "Our heritage"}
        title={locale === "ta" ? "கோவில் வரலாறு" : "Temple History"}
        locale={locale}
      />
      <div className="page-container max-w-4xl py-12 sm:py-16">
        {settings && (
          <p
            className={`mx-auto max-w-3xl text-pretty text-xl leading-relaxed text-text-primary ${
              // Drop cap for Latin only — ::first-letter can split a Tamil
              // grapheme cluster (consonant + vowel sign) mid-character.
              locale === "ta"
                ? langClass
                : "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.9] first-letter:text-primary"
            }`}
          >
            {pick(settings.historyIntro_en, settings.historyIntro_ta, locale)}
          </p>
        )}

        <h2 className={`mt-16 border-b border-border pb-4 text-2xl font-semibold text-text-primary sm:text-3xl ${headingClass}`}>
          {locale === "ta" ? "காலவரிசை" : "Timeline"}
        </h2>

        {entries.length === 0 ? (
          <p className={`mt-8 text-text-secondary ${langClass}`}>
            {locale === "ta" ? "காலவரிசை விவரங்கள் விரைவில் சேர்க்கப்படும்." : "Timeline details will be added here shortly."}
          </p>
        ) : (
          <ol className="mt-4">
            {entries.map((entry) => (
              <li key={entry.id} className="grid gap-2 border-b border-border py-8 sm:grid-cols-[9rem_1fr] sm:gap-10">
                <p className="font-display text-3xl font-semibold tabular-nums text-primary">{entry.year}</p>
                <div>
                  <h3 className={`text-xl font-semibold text-text-primary ${headingClass}`}>{pick(entry.title_en, entry.title_ta, locale)}</h3>
                  {(entry.description_en || entry.description_ta) && (
                    <p className={`mt-2 whitespace-pre-wrap leading-relaxed text-text-secondary ${langClass}`}>
                      {pick(entry.description_en ?? "", entry.description_ta, locale)}
                    </p>
                  )}
                  {entry.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.image} alt="" className="mt-5 max-h-72 rounded-2xl border border-border object-cover" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
