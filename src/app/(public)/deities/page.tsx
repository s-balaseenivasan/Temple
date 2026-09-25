import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import PageHeader from "@/components/page-header";
import { ArchFrame } from "@/components/decorative";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

// Each deity gets a full row — arched portrait beside name and description,
// alternating sides — rather than a card grid, so every sannidhi is given
// room and none reads as a thumbnail.
export default async function DeitiesPage() {
  const [deities, locale] = await Promise.all([
    prisma.deity.findMany({ where: { status: "active" }, orderBy: { sortOrder: "asc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <>
      <PageHeader kicker={locale === "ta" ? "சன்னதிகள்" : "Sannidhi"} title={locale === "ta" ? "தெய்வங்கள்" : "Deities"} locale={locale} />
      <div className="page-container max-w-5xl py-12 sm:py-16">
        <div className="divide-y divide-border">
          {deities.map((d, i) => {
            const name = pick(d.name_en, d.name_ta, locale);
            return (
              <Reveal
                key={d.id}
                className={`grid items-center gap-8 py-12 first:pt-0 last:pb-0 sm:gap-14 ${
                  i % 2 === 1 ? "sm:grid-cols-[1fr_minmax(0,15rem)]" : "sm:grid-cols-[minmax(0,15rem)_1fr]"
                }`}
              >
                <ArchFrame
                  src={d.image}
                  alt={name}
                  variant="tile"
                  className="mx-auto aspect-[4/5] w-full max-w-[15rem]"
                />
                <div className={i % 2 === 1 ? "sm:order-first sm:text-right" : ""}>
                  <p className="font-display text-sm font-semibold tabular-nums text-secondary">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className={`mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl ${headingClass}`}>{name}</h2>
                  {(d.description_en || d.description_ta) && (
                    <p className={`mt-4 text-pretty text-lg leading-relaxed text-text-secondary ${langClass}`}>
                      {pick(d.description_en ?? "", d.description_ta, locale)}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </>
  );
}
