"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import OfflineDonationForm from "@/app/admin/(protected)/donations/offline-donation-form";

interface Purpose {
  id: string;
  name_en: string;
}

// Same accessible-modal pattern already used for the public donation CTA
// (focus moved in on open, returned to the trigger on close, Escape/backdrop
// closes it, a click inside does not). The form itself — fields, validation,
// submit endpoint — is the exact existing OfflineDonationForm, unchanged;
// this component only changes where it's rendered (dialog vs. inline).
export default function RecordDonationModal({ purposes }: { purposes: Purpose[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
      triggerRef.current?.focus();
    };
  }, [open]);

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md"
      >
        Record Donation
      </button>

      {open &&
        createPortal(
          // Rendered into document.body via a portal — not just a nested
          // div — because this button sits inside the page header's
          // `.animate-admin-in` element. A CSS `transform` on ANY ancestor
          // (even the harmless-looking `translateY(0)` an animation settles
          // on) creates a new containing block for `position: fixed`
          // descendants, which silently breaks a nested fixed-position
          // backdrop: found via a real headed-browser screenshot showing the
          // backdrop collapsed to a thin strip near the top of the page
          // instead of covering the viewport. A portal sidesteps the whole
          // class of bug regardless of future ancestor styling.
          <div
            className="animate-fade-in fixed inset-0 z-[1300] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={onBackdropClick}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="record-donation-modal-title"
              className="animate-modal-in my-8 w-full max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <h2 id="record-donation-modal-title" className="text-lg font-semibold text-primary">
                    Record Offline / In-Kind Donation
                  </h2>
                  <p className="mt-0.5 text-sm text-text-secondary">Add a donation received directly at the temple.</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background hover:text-primary"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4">
                <OfflineDonationForm purposes={purposes} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
