"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Flower2 } from "lucide-react";
import DonationModal from "@/components/donation-modal";
import { t } from "@/lib/donation-copy";
import type { Locale } from "@/lib/i18n";

// Mounted once in the public layout — persistent across every public page,
// never duplicated per-page. Sits below the More dropdown (z-1100) and
// mobile drawer (z-1200) so it doesn't visually clash with either when
// they're open; the modal itself (z-1300) is the top-most layer, per the
// header redesign's layering system.
export default function DonationCta({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const langClass = locale === "ta" ? "font-tamil" : "";

  // Hidden on the donate flow itself — a floating "Donate" CTA over the
  // actual donation form/status/receipt-lookup pages would be redundant and
  // could tempt a second, conflicting entry point mid-flow.
  if (pathname.startsWith("/donate")) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`group fixed bottom-4 right-4 z-[950] flex h-[52px] items-center gap-2.5 rounded-full border border-gold/60 bg-ink py-1.5 pl-1.5 pr-5 font-semibold text-white shadow-[0_14px_30px_-12px_rgba(43,18,11,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark sm:bottom-6 sm:right-6 sm:h-14 ${langClass}`}
      >
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-light text-ink sm:h-11 sm:w-11">
          <Flower2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
        </span>
        <span className="text-sm">{t("floatingDonateLabel", locale)}</span>
      </button>

      <DonationModal open={open} onClose={() => setOpen(false)} locale={locale} triggerRef={triggerRef} />
    </>
  );
}
