"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { NavItem } from "@/components/public-nav";

// A proper click-to-open menu (not hover — hover-only menus are unpredictable
// and fail keyboard/touch use), closing on outside click, Escape, item
// selection, or route change. Two columns, so all eleven secondary pages
// are scannable at once instead of a long single-column list.
export default function MoreDropdown({
  items,
  locale,
}: {
  items: NavItem[];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const pathname = usePathname();
  const langClass = locale === "ta" ? "font-tamil" : "";
  const label = locale === "ta" ? "மேலும்" : "More";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const idx = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(idx - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex h-10 items-center gap-1 text-sm font-medium transition-colors ${
          open || items.some((i) => pathname.startsWith(i.href)) ? "text-primary" : "text-text-secondary hover:text-primary"
        } ${langClass}`}
      >
        {label}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="animate-fade-in absolute right-0 top-[calc(100%+14px)] z-[1100] grid w-[26rem] grid-cols-2 gap-x-1 rounded-2xl border border-border bg-surface p-2 shadow-[0_18px_40px_-18px_rgba(43,18,11,0.35)]"
        >
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              onClick={() => setOpen(false)}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-lg px-3 py-1.5 text-sm outline-none transition-colors duration-150 hover:bg-surface-muted hover:text-primary focus-visible:bg-surface-muted focus-visible:text-primary ${
                pathname.startsWith(item.href) ? "font-semibold text-primary" : "text-text-secondary"
              } ${langClass}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
