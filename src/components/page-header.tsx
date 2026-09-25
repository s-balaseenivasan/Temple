import type { Locale } from "@/lib/i18n";

// Inner-page masthead: a centred typographic stack on paper — kicker, large
// serif title, supporting line, then a short accent rule — so every page
// opens the same calm, editorial way. No imagery or gradient: the type is
// the design. `children` renders below the rule (e.g. the Events tabs).
export default function PageHeader({
  kicker,
  title,
  subtitle,
  locale,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  locale: Locale;
  children?: React.ReactNode;
}) {
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";
  const langClass = locale === "ta" ? "font-tamil" : "";
  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-surface-muted/50">
      <div className="pattern-kolam pointer-events-none absolute inset-0 opacity-[0.10] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
      <div className="page-container relative flex flex-col items-center py-14 text-center sm:py-20">
        {kicker && <p className={`kicker ${langClass}`}>{kicker}</p>}
        <h1
          className={`mt-3 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-5xl ${headingClass}`}
        >
          {title}
        </h1>
        {subtitle && <p className={`mt-5 max-w-2xl text-pretty text-base text-text-secondary sm:text-lg ${langClass}`}>{subtitle}</p>}
        <span className="accent-rule mt-8" aria-hidden="true" />
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
