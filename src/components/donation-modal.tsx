"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Flower2 } from "lucide-react";
import { t } from "@/lib/donation-copy";
import { QUICK_DONATION_AMOUNTS } from "@/lib/donation-amounts";
import type { Locale } from "@/lib/i18n";

// Feeds into the EXISTING donation form/payment flow — this modal never
// submits a donation or talks to the payment gateway itself. It only
// collects a quick amount and hands off to /donate (which still requires
// name/mobile/purpose and runs through the real, already-built
// POST /api/donations → gateway → webhook → receipt pipeline unchanged).
export default function DonationModal({
  open,
  onClose,
  locale,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      // Standard modal accessibility pattern: return focus to whatever
      // opened the dialog once it closes.
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setCustom("");
    }
  }, [open]);

  if (!open) return null;

  const amount = custom ? Number(custom) : selected;
  const canContinue = !!amount && amount >= 10;

  function handleContinue() {
    if (!canContinue) return;
    router.push(`/donate?amount=${amount}`);
    onClose();
  }

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm animate-fade-in"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-modal-title"
        className="animate-modal-in w-full max-w-[480px] overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
      >
        <div className="relative flex items-start justify-between bg-primary px-6 pb-8 pt-6 text-white sm:px-7">
          <div className="pattern-kolam pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />
          <span aria-hidden="true" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gold-light text-ink">
            <Flower2 className="h-5 w-5" />
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t("modalClose", locale)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-6 sm:px-7">
        <h2 id="donation-modal-title" className={`text-2xl font-semibold text-text-primary ${headingClass}`}>
          {t("formTitle", locale).replace(/^🙏\s*/, "")}
        </h2>

        <p className={`mt-2 text-sm text-text-secondary ${langClass}`}>{t("modalAmountPrompt", locale)}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_DONATION_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setSelected(amt);
                setCustom("");
              }}
              aria-pressed={selected === amt && !custom}
              className={`h-12 rounded-full border font-display text-base font-semibold tabular-nums transition-colors ${
                selected === amt && !custom
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-primary hover:border-primary"
              }`}
            >
              ₹{amt.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        <input
          type="number"
          min={10}
          inputMode="numeric"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setSelected(null);
          }}
          placeholder={t("modalCustomAmountPlaceholder", locale)}
          aria-label={t("modalCustomAmountPlaceholder", locale)}
          className={`form-input mt-3 rounded-full px-5 ${langClass}`}
        />

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={`btn btn-primary mt-5 h-12 w-full ${langClass}`}
        >
          {t("modalContinueButton", locale)}
          <span aria-hidden="true">→</span>
        </button>
        </div>
      </div>
    </div>
  );
}
