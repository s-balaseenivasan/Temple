import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Info, MapPin, Phone } from "lucide-react";
import { OrnamentalDivider } from "@/components/decorative";

export const dynamic = "force-dynamic";

// FEAT-006: registrationRequired is display-only informational text — no booking flow exists (out of scope).
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, locale] = await Promise.all([
    prisma.event.findUnique({ where: { id }, include: { category: true } }),
    getLocale(),
  ]);
  if (!event || event.status !== "published") notFound();
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  const location = event.location_en || event.location_ta ? pick(event.location_en ?? "", event.location_ta, locale) : null;

  return (
    <article className="page-container max-w-3xl py-12 sm:py-16">
      <Link href="/events" className={`link-arrow ${langClass}`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {locale === "ta" ? "நிகழ்வுகளுக்குத் திரும்பு" : "Back to Events"}
      </Link>

      <header className="mt-10">
        <span className={`inline-block rounded-full bg-gold-light/30 px-3 py-1 text-xs font-semibold text-primary-dark ${langClass}`}>
          {pick(event.category.name_en, event.category.name_ta, locale)}
        </span>
        <h1 className={`mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-5xl ${headingClass}`}>
          {pick(event.name_en, event.name_ta, locale)}
        </h1>
      </header>

      <dl className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Meta icon={<CalendarDays className="h-4 w-4" />} label={locale === "ta" ? "தேதி" : "Date"} langClass={langClass}>
          {event.eventDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })}
        </Meta>
        {event.startTime && (
          <Meta icon={<Clock className="h-4 w-4" />} label={locale === "ta" ? "நேரம்" : "Time"} langClass={langClass}>
            <span className="tabular-nums">
              {event.startTime}
              {event.endTime ? ` – ${event.endTime}` : ""}
            </span>
          </Meta>
        )}
        {location && (
          <Meta icon={<MapPin className="h-4 w-4" />} label={locale === "ta" ? "இடம்" : "Venue"} langClass={langClass}>
            <span className={langClass}>{location}</span>
          </Meta>
        )}
      </dl>

      {(event.description_en || event.description_ta) && (
        <p className={`mt-10 whitespace-pre-wrap text-lg leading-relaxed text-text-primary ${langClass}`}>
          {pick(event.description_en ?? "", event.description_ta, locale)}
        </p>
      )}

      {event.registrationRequired && (
        <p className={`mt-10 flex items-start gap-3 rounded-2xl border border-gold/60 bg-gold-light/15 p-5 text-sm text-primary-dark ${langClass}`}>
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          {locale === "ta"
            ? "பதிவு தேவை — பதிவு செய்ய கோவில் அலுவலகத்தை தொடர்பு கொள்ளவும்."
            : "Registration required — please contact the temple office to register."}
        </p>
      )}

      {(event.contactPersonName || event.contactNumber) && (
        <p className="mt-10 flex items-center gap-2 border-t border-border pt-6 text-sm text-text-secondary">
          <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
          <span className={langClass}>{locale === "ta" ? "தொடர்பு" : "Contact"}:</span> {event.contactPersonName} {event.contactNumber}
        </p>
      )}

      <OrnamentalDivider className="mt-14" />
    </article>
  );
}

function Meta({ icon, label, langClass, children }: { icon: React.ReactNode; label: string; langClass: string; children: React.ReactNode }) {
  return (
    <div className="py-5 sm:px-6 sm:first:pl-0">
      <dt className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary ${langClass}`}>
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 font-medium text-text-primary">{children}</dd>
    </div>
  );
}
