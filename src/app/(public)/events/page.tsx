import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-005: upcoming/this-month/past, partitioned by eventDate vs today (date only, RULE-023 edge case).
export default async function EventsHubPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "upcoming" } = await searchParams;
  const locale = await getLocale();
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const where =
    tab === "past"
      ? { status: "published" as const, eventDate: { lt: todayStart } }
      : tab === "thisMonth"
        ? { status: "published" as const, eventDate: { gte: monthStart, lt: monthEnd } }
        : { status: "published" as const, eventDate: { gte: todayStart } };

  const events = await prisma.event.findMany({
    where,
    orderBy: { eventDate: tab === "past" ? "desc" : "asc" },
    include: { category: true },
  });

  const tabs = [
    { key: "upcoming", label: locale === "ta" ? "வரவிருக்கும்" : "Upcoming" },
    { key: "thisMonth", label: locale === "ta" ? "இந்த மாதம்" : "This Month" },
    { key: "past", label: locale === "ta" ? "கடந்தவை" : "Past" },
  ];

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "கோவில் நாட்காட்டி" : "Temple calendar"}
        title={locale === "ta" ? "நிகழ்வுகள்" : "Events"}
        locale={locale}
      >
        <nav aria-label={locale === "ta" ? "நிகழ்வு வடிகட்டி" : "Filter events"} className="inline-flex rounded-full border border-border bg-surface p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/events?tab=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${langClass} ${
                tab === t.key ? "bg-primary text-white" : "text-text-secondary hover:text-primary"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="page-container max-w-4xl py-12 sm:py-16">
        {events.length > 0 ? (
          <ul className="divide-y divide-border border-y border-border">
            {events.map((e) => {
              const day = e.eventDate.getUTCDate();
              const month = e.eventDate.toLocaleDateString(locale === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
              return (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="group grid grid-cols-[4.5rem_1fr] gap-5 py-7 sm:grid-cols-[6.5rem_1fr_auto] sm:gap-8">
                    <div className="text-primary">
                      <span className="block font-display text-4xl font-semibold leading-none tabular-nums sm:text-5xl">{day}</span>
                      <span className={`mt-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary ${langClass}`}>{month}</span>
                    </div>
                    <div className="min-w-0">
                      <span className={`inline-block rounded-full bg-gold-light/30 px-3 py-1 text-xs font-semibold text-primary-dark ${langClass}`}>
                        {pick(e.category.name_en, e.category.name_ta, locale)}
                      </span>
                      <h2
                        className={`mt-3 text-xl font-semibold leading-snug text-text-primary underline-offset-4 group-hover:text-primary group-hover:underline sm:text-2xl ${headingClass}`}
                      >
                        {pick(e.name_en, e.name_ta, locale)}
                      </h2>
                      {e.startTime && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                          <Clock aria-hidden="true" className="h-4 w-4" />
                          <span className="tabular-nums">
                            {e.startTime}
                            {e.endTime ? ` – ${e.endTime}` : ""}
                          </span>
                        </p>
                      )}
                    </div>
                    <span
                      aria-hidden="true"
                      className="hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white sm:flex"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>
            {locale === "ta" ? "இந்தப் பிரிவில் நிகழ்வுகள் இல்லை." : "No events in this view."}
          </p>
        )}
      </div>
    </>
  );
}
