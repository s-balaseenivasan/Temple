"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import PublicNav, { type NavItem } from "@/components/public-nav";
import MobileNavigation from "@/components/mobile-navigation";
import LanguageSwitcher from "@/components/language-switcher";
import DonateButton from "@/components/donate-button";
import AdminButton from "@/components/admin-button";
import { LotusIcon } from "@/components/decorative";
import type { Locale } from "@/lib/i18n";

// Two tiers, museum-style: a slim maroon utility bar ("Open today …" +
// language) that scrolls away, and a sticky paper-coloured nav bar below it.
// Sticky rather than fixed, so no page needs to reserve header space or
// bleed its hero under an overlay. z-[1000] (dropdown 1100, mobile drawer
// 1200, donation modal 1300 — see those components).
export default function SiteHeader({
  templeName,
  primary,
  more,
  mobileItems,
  locale,
  todayHours,
}: {
  templeName: string;
  primary: NavItem[];
  more: NavItem[];
  mobileItems: NavItem[];
  locale: Locale;
  todayHours: string | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const langClass = locale === "ta" ? "font-tamil" : "";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-ink text-white/85">
        <div className="page-container flex h-10 items-center justify-between gap-4 text-xs">
          {todayHours ? (
            <Link href="/contact" className={`group flex min-w-0 items-center gap-2 hover:text-white ${langClass}`}>
              <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gold-light" />
              <span className="truncate">
                <span className="font-semibold text-white">{locale === "ta" ? "இன்று திறந்திருக்கும்" : "Open today"}</span>
                <span className="mx-2 text-white/40" aria-hidden="true">
                  |
                </span>
                <span className="tabular-nums">{todayHours}</span>
              </span>
            </Link>
          ) : (
            <span className={`text-white/85 ${langClass}`}>{locale === "ta" ? "ஓம் ஸ்ரீ குருப்யோ நமஹ" : "Om Sri Gurubhyo Namah"}</span>
          )}
          <div className="hidden shrink-0 lg:block">
            <LanguageSwitcher current={locale} tone="overlay" size="sm" />
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-[1000] border-b bg-background/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-background/85 ${
          scrolled ? "border-border shadow-[0_6px_20px_-12px_rgba(43,18,11,0.35)]" : "border-border/70"
        }`}
      >
        <div className="page-container flex h-[72px] items-center gap-4">
          {/* flex-1 + min-w-0: the name is the element that truncates, so
              the nav/CTA group never gets squeezed at any viewport width. */}
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/70 bg-surface text-primary"
            >
              <LotusIcon className="h-6 w-6" />
            </span>
            <span
              className={`block min-w-0 truncate text-lg font-semibold leading-tight text-primary sm:text-xl ${
                locale === "ta" ? "font-tamil-display" : "font-display"
              }`}
            >
              {templeName}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-5">
            <PublicNav primary={primary} more={more} locale={locale} activePath={pathname} />
            <div className="hidden items-center gap-2 lg:flex">
              <AdminButton />
              <DonateButton locale={locale} />
            </div>
            <MobileNavigation items={mobileItems} locale={locale} />
          </div>
        </div>
      </header>
    </>
  );
}
