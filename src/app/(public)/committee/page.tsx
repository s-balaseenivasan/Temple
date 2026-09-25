import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { UserRound } from "lucide-react";
import PageHeader from "@/components/page-header";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic";

// FEAT-028: only status='active', ordered by displayOrder. No financial data
// ever shown/linked here (brief §1 — Option A, no donation attribution).
export default async function CommitteePage() {
  const [members, locale] = await Promise.all([
    prisma.committeeMember.findMany({
      where: { status: "active" },
      orderBy: { displayOrder: "asc" },
      include: { designation: true },
    }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil-display" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "நிர்வாகம்" : "Stewardship"}
        title={locale === "ta" ? "நிர்வாக கமிட்டி" : "Temple Committee"}
        locale={locale}
      />
      <div className="page-container py-12 sm:py-16">
        {members.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <Reveal key={m.id} delayMs={(i % 6) * 60} className="flex flex-col items-center text-center">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photo}
                    alt={pick(m.name_en, m.name_ta, locale)}
                    className="h-32 w-32 rounded-full object-cover outline outline-1 outline-offset-[6px] outline-gold/60"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-surface-muted text-primary/60 outline outline-1 outline-offset-[6px] outline-gold/60">
                    <UserRound aria-hidden="true" className="h-12 w-12" />
                  </div>
                )}
                <p className={`mt-6 text-xl font-semibold text-text-primary ${headingClass}`}>{pick(m.name_en, m.name_ta, locale)}</p>
                <p className={`mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-secondary ${langClass}`}>
                  {pick(m.designation.name_en, m.designation.name_ta, locale)}
                </p>
                {m.publicMobileVisible && <p className="mt-2 text-sm tabular-nums text-text-secondary">{m.mobile}</p>}
              </Reveal>
            ))}
          </div>
        ) : (
          <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>
            {locale === "ta" ? "தற்போது பட்டியலிடப்பட்ட உறுப்பினர்கள் இல்லை." : "No committee members listed yet."}
          </p>
        )}
      </div>
    </>
  );
}
