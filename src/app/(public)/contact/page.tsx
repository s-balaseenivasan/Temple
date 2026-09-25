import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { Mail, MapPin, Phone } from "lucide-react";
import TimingsWidget from "@/components/timings-widget";
import ContactForm from "./contact-form";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-011: address/phone/email + map (graceful degradation to text-only
// when coordinates are missing, per the blueprint's own edge case).
export default async function ContactPage() {
  const settings = await prisma.siteSettings.findFirst();
  const locale = await getLocale();
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  if (!settings) return null;

  const hasCoords = settings.mapLatitude != null && settings.mapLongitude != null;
  const labelClass = `text-xs font-semibold uppercase tracking-[0.14em] text-secondary ${langClass}`;

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "எங்களை சந்திக்க" : "Visit us"}
        title={locale === "ta" ? "தொடர்பு" : "Contact Us"}
        subtitle={
          locale === "ta"
            ? "கேள்விகள், பூஜை விவரங்கள் அல்லது உதவிக்கு கோவில் அலுவலகத்தைத் தொடர்பு கொள்ளுங்கள்."
            : "Write to the temple office with questions, pooja details or requests for help."
        }
        locale={locale}
      />
      <div className="page-container grid gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <dl className="divide-y divide-border border-y border-border">
            <InfoRow icon={<MapPin className="h-5 w-5" />} label={locale === "ta" ? "முகவரி" : "Address"} labelClass={labelClass}>
              <span className={langClass}>{pick(settings.addressLine_en, settings.addressLine_ta, locale)}</span>
            </InfoRow>
            <InfoRow icon={<Phone className="h-5 w-5" />} label={locale === "ta" ? "தொலைபேசி" : "Phone"} labelClass={labelClass}>
              {settings.phone ? (
                <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-primary hover:underline">
                  {settings.phone}
                </a>
              ) : (
                "—"
              )}
            </InfoRow>
            {settings.email && (
              <InfoRow icon={<Mail className="h-5 w-5" />} label={locale === "ta" ? "மின்னஞ்சல்" : "Email"} labelClass={labelClass}>
                <a href={`mailto:${settings.email}`} className="break-all hover:text-primary hover:underline">
                  {settings.email}
                </a>
              </InfoRow>
            )}
          </dl>

          <h2 className={`mt-12 text-2xl font-semibold text-text-primary ${headingClass}`}>{locale === "ta" ? "கோவில் நேரங்கள்" : "Temple Timings"}</h2>
          <div className="mt-4 border-t border-border pt-2">
            <TimingsWidget timingsJson={settings.timingsJson} locale={locale} />
          </div>

          <div className="mt-12">
            {hasCoords ? (
              <iframe
                title="Temple location map"
                className="h-72 w-full rounded-2xl border border-border"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${settings.mapLatitude},${settings.mapLongitude}&output=embed`}
              />
            ) : (
              <p className={`rounded-2xl bg-surface-muted/70 p-5 text-sm text-text-secondary ${langClass}`}>
                {locale === "ta" ? "வரைபடம் தற்போது கிடைக்கவில்லை." : "Map is not available yet — see the address above."}
              </p>
            )}
          </div>
        </div>

        <div className="panel self-start p-6 sm:p-10">
          <p className={`kicker ${langClass}`}>{locale === "ta" ? "கடிதம்" : "Write to us"}</p>
          <h2 className={`mb-8 mt-2 text-3xl font-semibold text-text-primary ${headingClass}`}>
            {locale === "ta" ? "எங்களுக்கு செய்தி அனுப்பவும்" : "Send Us a Message"}
          </h2>
          <ContactForm locale={locale} />
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  labelClass,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-5">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 text-primary">
        {icon}
      </span>
      <div>
        <dt className={labelClass}>{label}</dt>
        <dd className="mt-1 text-text-primary">{children}</dd>
      </div>
    </div>
  );
}
