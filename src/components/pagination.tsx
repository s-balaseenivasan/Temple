import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Generic GET-param-based pagination — reuses whatever filter params the
// caller already has in the URL (search/status/purpose/date range on the
// donations page), only ever changing `page`. No new API/route: the same
// server component just re-queries with a different skip/take.
export default function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-1">
      <PageLink href={buildHref(page - 1)} disabled={page <= 1} ariaLabel="Previous page">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </PageLink>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-text-secondary">
            …
          </span>
        ) : (
          <PageLink key={p} href={buildHref(p)} active={p === page} ariaLabel={`Page ${p}`}>
            {p}
          </PageLink>
        ),
      )}

      <PageLink href={buildHref(page + 1)} disabled={page >= totalPages} ariaLabel="Next page">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const base = "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  if (disabled) {
    // A <button disabled> (not a bare <span>) — axe-core correctly flags
    // aria-label on a span as invalid, since a span has no role that
    // supports naming. A disabled button is also the semantically correct,
    // natively keyboard-safe way to represent an inactive pagination step.
    return (
      <button type="button" disabled aria-label={ariaLabel} className={`${base} cursor-not-allowed text-text-secondary/40`}>
        {children}
      </button>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={`${base} ${active ? "bg-primary text-white" : "text-text-secondary hover:bg-surface-muted hover:text-primary"}`}
    >
      {children}
    </Link>
  );
}

// Windowed page numbers with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20
function pageWindow(current: number, total: number): (number | "…")[] {
  const delta = 1;
  const range: number[] = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);

  const result: (number | "…")[] = [1];
  if (range[0] > 2) result.push("…");
  result.push(...range);
  if (range[range.length - 1] < total - 1) result.push("…");
  if (total > 1) result.push(total);
  return result;
}
