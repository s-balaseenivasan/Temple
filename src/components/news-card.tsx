import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

// Editorial list row, not a boxed card: a serif date column, headline and
// excerpt, separated from its neighbours by hairlines (the parent list
// supplies the dividers).
export default function NewsCard({
  href,
  title,
  excerpt,
  date,
  locale,
}: {
  href: string;
  title: string;
  excerpt: string;
  date: Date | null;
  locale: Locale;
}) {
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";
  const dateLocale = locale === "ta" ? "ta-IN" : "en-IN";
  const day = date?.getDate();
  const monthYear = date?.toLocaleDateString(dateLocale, { month: "short", year: "numeric" });

  return (
    <Link href={href} className="group grid grid-cols-[4.5rem_1fr] gap-5 py-7 sm:grid-cols-[6.5rem_1fr_auto] sm:gap-8">
      <div className="text-primary">
        {date ? (
          <>
            <span className="block font-display text-4xl font-semibold leading-none tabular-nums sm:text-5xl">{day}</span>
            <span className={`mt-2 block text-xs font-semibold uppercase tracking-wide text-text-secondary ${langClass}`}>{monthYear}</span>
          </>
        ) : null}
      </div>
      <div className="min-w-0">
        <h3
          className={`text-xl font-semibold leading-snug text-text-primary underline-offset-4 transition-colors group-hover:text-primary group-hover:underline sm:text-2xl ${headingClass}`}
        >
          {title}
        </h3>
        <p className={`mt-2 line-clamp-2 max-w-2xl text-text-secondary ${langClass}`}>{excerpt}</p>
      </div>
      <span
        aria-hidden="true"
        className="hidden h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white sm:flex"
      >
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </Link>
  );
}
