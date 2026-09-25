"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Photo {
  id: string;
  imageUrl: string;
  caption_en: string | null;
}

// FEAT-008: full-screen image viewer with keyboard navigation (next/prev/close).
export default function LightboxGrid({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)), [photos.length]);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, next, prev]);

  const navButton =
    "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {photos.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setOpenIndex(idx)}
            className="group overflow-hidden rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.caption_en ?? ""}
              className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="animate-fade-in fixed inset-0 z-[1300] flex flex-col items-center justify-center bg-ink/95 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button onClick={close} className={`${navButton} right-4 top-4 translate-y-0`} aria-label="Close">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className={`${navButton} left-4`}
            aria-label="Previous"
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[openIndex].imageUrl}
            alt={photos[openIndex].caption_en ?? ""}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-4 text-center text-sm text-white/85">
            {photos[openIndex].caption_en && <span className="font-display text-base italic text-white">{photos[openIndex].caption_en} · </span>}
            <span className="tabular-nums">
              {openIndex + 1} / {photos.length}
            </span>
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className={`${navButton} right-4`}
            aria-label="Next"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
