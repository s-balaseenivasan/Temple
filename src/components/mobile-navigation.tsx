"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LockKeyhole, Menu, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { NavItem } from "@/components/public-nav";
import LanguageSwitcher from "@/components/language-switcher";

// A proper slide-in drawer (not an inline dropdown panel) — full nav list,
// scrollable, with its own close button, Escape handling, backdrop-click
// dismissal, body-scroll lock while open, and auto-close on navigation.
export default function MobileNavigation({ items, locale }: { items: NavItem[]; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const langClass = locale === "ta" ? "font-tamil" : "";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={locale === "ta" ? "பட்டியலைத் திற" : "Toggle menu"}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-primary transition-colors hover:border-primary"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="animate-fade-in fixed inset-0 z-[1200] bg-ink/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ta" ? "வழிசெலுத்தல் பட்டியல்" : "Navigation menu"}
            className="animate-slide-in-right fixed inset-y-0 right-0 z-[1200] flex w-full max-w-sm flex-col bg-background shadow-2xl"
          >
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5">
              <span className={`kicker ${langClass}`}>{locale === "ta" ? "வழிசெலுத்தல்" : "Menu"}</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={locale === "ta" ? "மூடு" : "Close menu"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-2">
              <ul className="divide-y divide-border/70">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`group flex min-h-12 items-center justify-between gap-3 py-2 text-[0.95rem] transition-colors hover:text-primary ${
                        isActive(item.href) ? "font-semibold text-primary" : "text-text-primary"
                      } ${langClass}`}
                    >
                      {item.label}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
              <LanguageSwitcher current={locale} />
              <Link
                href="/admin/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
                Admin
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
