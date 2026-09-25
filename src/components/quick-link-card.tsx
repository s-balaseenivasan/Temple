import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Numbered index entry ("01 — Pooja & Festivals →") with a short
// description — a table-of-contents treatment rather than a candy-coloured
// icon tile, so it stays in the temple palette.
export default function QuickLinkCard({
  href,
  index,
  label,
  description,
  langClass,
}: {
  href: string;
  index: number;
  label: string;
  description?: string;
  langClass: string;
}) {
  const headingClass = langClass ? "font-tamil-display" : "font-display";
  return (
    <Link href={href} className="group flex h-full flex-col gap-4 bg-background p-6 transition-colors hover:bg-surface sm:p-8">
      <span className="font-display text-sm font-semibold tabular-nums text-secondary">{String(index).padStart(2, "0")}</span>
      <span className={`text-xl font-semibold leading-snug text-text-primary group-hover:text-primary ${headingClass}`}>{label}</span>
      {description && <span className={`text-sm text-text-secondary ${langClass}`}>{description}</span>}
      <span
        aria-hidden="true"
        className="mt-auto flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
