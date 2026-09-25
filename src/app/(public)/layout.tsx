import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { resolveTimings } from "@/lib/timings";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import DonationCta from "@/components/donation-cta";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, locale] = await Promise.all([prisma.siteSettings.findFirst(), getLocale()]);

  const templeName = settings ? pick(settings.templeName_en, settings.templeName_ta, locale) : "Temple";

  // Primary: the highest-traffic destinations, always visible as plain nav
  // links. Donate is deliberately NOT in this row — it's rendered as its own
  // CTA button in SiteHeader — and Admin similarly gets its own link.
  // Everything else lives behind "More".
  const primary = [
    { href: "/", label: locale === "ta" ? "முகப்பு" : "Home" },
    { href: "/news", label: locale === "ta" ? "செய்திகள்" : "News" },
    { href: "/events", label: locale === "ta" ? "நிகழ்வுகள்" : "Events" },
    { href: "/gallery", label: locale === "ta" ? "புகைப்படங்கள்" : "Gallery" },
  ];
  const donateItem = { href: "/donate", label: locale === "ta" ? "நன்கொடை" : "Donate" };

  const more = [
    { href: "/videos", label: locale === "ta" ? "காணொளிகள்" : "Videos" },
    // "நிர்வாகக் குழு" (management committee) is used here, distinct from
    // "நிர்வாகம்" (administration) below — same English root word, but the
    // two public pages describe different things (the person directory vs.
    // the structural/process description), so the Tamil labels shouldn't collide.
    { href: "/committee", label: locale === "ta" ? "நிர்வாகக் குழு" : "Committee" },
    { href: "/deities", label: locale === "ta" ? "தெய்வங்கள்" : "Deities" },
    { href: "/pooja-festivals", label: locale === "ta" ? "பூஜைகள் மற்றும் திருவிழாக்கள்" : "Pooja & Festivals" },
    { href: "/administration", label: locale === "ta" ? "நிர்வாகம்" : "Administration" },
    { href: "/bhaktha-sabha", label: locale === "ta" ? "பக்த சபை" : "Bhaktha Sabha" },
    { href: "/welfare", label: locale === "ta" ? "நலப்பணிகள்" : "Welfare Works" },
    { href: "/pangaligal", label: locale === "ta" ? "பங்காளிகள்" : "Pangaligal" },
    { href: "/documents", label: locale === "ta" ? "ஆவணங்கள்" : "Documents" },
    { href: "/history", label: locale === "ta" ? "வரலாறு" : "History" },
    { href: "/contact", label: locale === "ta" ? "தொடர்பு" : "Contact" },
  ];

  const address = settings ? pick(settings.addressLine_en, settings.addressLine_ta, locale) : "";

  // "Open today" line for the utility bar — same FEAT-010 resolution as the
  // timings widget, so a special-day override shows here too.
  const timings = settings ? resolveTimings(settings.timingsJson) : null;
  const todayHours = timings?.activeOverride
    ? `${timings.activeOverride.open} – ${timings.activeOverride.close}`
    : timings?.standard
      ? `${timings.standard.morning.open} – ${timings.standard.morning.close} · ${timings.standard.evening.open} – ${timings.standard.evening.close}`
      : null;

  // Mobile drawer shows every destination as one flat, scrollable list —
  // Donate included inline at its natural position — with Admin and the
  // language switcher pinned below (see MobileNavigation).
  const mobileItems = [...primary.slice(0, 4), donateItem, ...more];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        templeName={templeName}
        primary={primary}
        more={more}
        mobileItems={mobileItems}
        locale={locale}
        todayHours={todayHours}
      />

      <main className="flex-1">{children}</main>

      <SiteFooter
        templeName={templeName}
        address={address}
        phone={settings?.phone ?? ""}
        email={settings?.email ?? ""}
        todayHours={todayHours}
        locale={locale}
        links={[...primary, donateItem]}
        more={more}
      />
      <DonationCta locale={locale} />
    </div>
  );
}
