// App Router loading UI — shown automatically while the server component's
// data fetch is in flight. Skeleton dimensions mirror the real page so the
// layout doesn't jump when real content replaces it.
export default function DonationsLoading() {
  return (
    <div>
      <div className="mb-6 h-16 animate-pulse rounded-xl bg-surface-muted" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
        ))}
      </div>
      <div className="mb-6 h-56 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="mb-4 h-24 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="overflow-hidden rounded-2xl border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse border-b border-border/60 bg-surface last:border-0" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
