"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/lib/i18n";

// FEAT-027/065: EN/TA toggle, persisted via cookie (RULE-018), default Tamil
// per explicit stakeholder instruction. Setting the cookie client-side then
// calling router.refresh() re-runs server components with the new cookie
// value present on the next request.
//
// tone="overlay" is for dark surfaces (the header utility bar, the footer);
// "solid" is for paper/white surfaces (the mobile drawer).
export default function LanguageSwitcher({
  current,
  tone = "solid",
  size = "md",
}: {
  current: Locale;
  tone?: "solid" | "overlay";
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: Locale) {
    document.cookie = `lang=${locale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  const containerClass = tone === "overlay" ? "border-white/25" : "border-border bg-surface";
  const activeClass = tone === "overlay" ? "bg-gold-light text-ink" : "bg-primary text-white";
  const inactiveClass = tone === "overlay" ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-text-secondary hover:bg-surface-muted";
  const heightClass = size === "sm" ? "h-7" : "h-10";

  return (
    <div
      role="group"
      aria-label="Language / மொழி"
      className={`inline-flex items-center rounded-full border p-0.5 text-xs ${heightClass} ${containerClass}`}
    >
      <button
        onClick={() => setLocale("en")}
        disabled={isPending}
        aria-pressed={current === "en"}
        className={`flex h-full items-center rounded-full px-3 font-semibold transition-colors ${current === "en" ? activeClass : inactiveClass}`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ta")}
        disabled={isPending}
        aria-pressed={current === "ta"}
        className={`font-tamil flex h-full items-center rounded-full px-3 font-semibold leading-none transition-colors ${
          current === "ta" ? activeClass : inactiveClass
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
}
