import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { LotusIcon, OrnamentalDivider } from "@/components/decorative";
import type { NavItem } from "@/components/public-nav";

const TAGLINE_TA = "முன்னோர் வழி – தெய்வ பக்தி – பங்காளிகள் ஒற்றுமை – தலைமுறைகள் தொடரும் பாரம்பரியம்";
const TAGLINE_EN = "Our ancestors' path — devotion to God — unity of members — a tradition that continues through generations";

export default function SiteFooter({
  templeName,
  address,
  phone,
  email,
  todayHours,
  locale,
  links,
  more,
}: {
  templeName: string;
  address: string;
  phone: string;
  email: string;
  todayHours: string | null;
  locale: Locale;
  links: NavItem[];
  more: NavItem[];
}) {
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingLabel = `text-xs font-semibold uppercase tracking-[0.16em] text-gold-light ${langClass}`;
  const linkClass = `text-white/75 transition-colors hover:text-white ${langClass}`;

  return (
    <footer className="bg-ink text-white/75">
      <div className="page-container pt-16 pb-10 sm:pt-20">
        {/* Tagline masthead — the temple's own line, set as the footer's
            signature rather than a generic "about us" blurb. */}
        <div className="flex flex-col items-center text-center">
          <LotusIcon className="h-10 w-10 text-gold-light" />
          <p className={`mt-5 max-w-3xl text-balance text-xl leading-relaxed text-white sm:text-2xl ${locale === "ta" ? "font-tamil-display" : "font-display italic"}`}>
            {locale === "ta" ? TAGLINE_TA : TAGLINE_EN}
          </p>
        </div>

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className={`text-xl font-semibold text-white ${locale === "ta" ? "font-tamil-display" : "font-display"}`}>{templeName}</p>
            <p className={`mt-4 flex max-w-xs items-start gap-2 text-sm ${langClass}`}>
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
              {address}
            </p>
            {todayHours && (
              <p className="mt-3 flex items-start gap-2 text-sm">
                <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span className="tabular-nums">{todayHours}</span>
              </p>
            )}
          </div>

          <div>
            <p className={headingLabel}>{locale === "ta" ? "விரைவு இணைப்புகள்" : "Explore"}</p>
            <nav aria-label={locale === "ta" ? "விரைவு இணைப்புகள்" : "Footer"} className="mt-4 flex flex-col gap-2.5 text-sm">
              {links.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className={headingLabel}>{locale === "ta" ? "கோவில்" : "The Temple"}</p>
            <nav aria-label={locale === "ta" ? "கோவில்" : "The Temple"} className="mt-4 flex flex-col gap-2.5 text-sm">
              {more.slice(0, 7).map((item) => (
                <Link key={item.href} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className={headingLabel}>{locale === "ta" ? "தொடர்புக்கு" : "Get in touch"}</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-white/75 hover:text-white">
                  <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-light" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 break-all text-white/75 hover:text-white">
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-light" />
                  {email}
                </a>
              )}
            </div>
            <p className={`mt-6 max-w-xs text-sm ${langClass}`}>
              {locale === "ta"
                ? "உங்கள் நன்கொடை கோவில் பராமரிப்பு மற்றும் நலப்பணிகளுக்கு பயன்படுத்தப்படுகிறது."
                : "Your donations support temple maintenance and community welfare works."}
            </p>
            <Link href="/donate" className={`btn btn-gold mt-4 ${langClass}`}>
              {locale === "ta" ? "நன்கொடை அளிக்க" : "Donate Now"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14">
          <OrnamentalDivider className="text-gold-light/60" />
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          &copy; {new Date().getFullYear()} {templeName}
        </p>
      </div>
    </footer>
  );
}
