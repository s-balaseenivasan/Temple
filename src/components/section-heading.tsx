import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

// Section head: kicker + serif title, with an optional "View all" link that
// sits on the baseline to the right (left-aligned) or under the rule
// (centred). The view-all link is hidden on mobile here — callers render a
// full-width one after the section's content instead.
export default function SectionHeading({
  kicker,
  title,
  locale,
  viewAllHref,
  viewAllLabel,
  align = "left",
  intro,
}: {
  kicker?: string;
  title: string;
  locale: Locale;
  viewAllHref?: string;
  viewAllLabel?: string;
  align?: "left" | "center";
  intro?: string;
}) {
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";
  const langClass = locale === "ta" ? "font-tamil" : "";

  const viewAll = viewAllHref && (
    <Link href={viewAllHref} className={`link-arrow hidden shrink-0 sm:inline-flex ${langClass}`}>
      {viewAllLabel}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );

  if (align === "center") {
    return (
      <div className="mb-12 flex flex-col items-center text-center">
        {kicker && <p className={`kicker ${langClass}`}>{kicker}</p>}
        <h2 className={`mt-3 text-balance text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl ${headingClass}`}>{title}</h2>
        {intro && <p className={`mt-4 max-w-2xl text-pretty text-text-secondary ${langClass}`}>{intro}</p>}
        <span className="accent-rule mt-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-5">
      <div>
        {kicker && <p className={`kicker ${langClass}`}>{kicker}</p>}
        <h2 className={`mt-2 text-balance text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl ${headingClass}`}>{title}</h2>
        {intro && <p className={`mt-3 max-w-2xl text-pretty text-text-secondary ${langClass}`}>{intro}</p>}
      </div>
      {viewAll}
    </div>
  );
}
