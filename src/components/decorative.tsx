// Decorative, purely ornamental SVG motifs used across the public site.
// No temple/deity photography exists in this project yet (confirmed: only
// default Next.js placeholder SVGs were present in public/), so these
// abstract line-art motifs stand in for real photography without fabricating
// any specific visual claim about the temple's actual appearance. Swap the
// <PlaceholderPanel>/<PlaceholderTile> usages for real <img>/<Image> tags
// once real photos are supplied.

export function LotusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path
        d="M32 44c0-10 6-16 6-16s6 6 6 16-6 12-6 12-6-2-6-12Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M32 44c0-10-6-16-6-16s-6 6-6 16 6 12 6 12 6-2 6-12Z" fill="currentColor" opacity="0.7" />
      <path d="M20 40c-8-2-12-8-12-8s6-4 14-2 10 8 10 8-4 4-12 2Z" fill="currentColor" opacity="0.55" />
      <path d="M44 40c8-2 12-8 12-8s-6-4-14-2-10 8-10 8 4 4 12 2Z" fill="currentColor" opacity="0.55" />
      <ellipse cx="32" cy="46" rx="5" ry="7" fill="currentColor" />
    </svg>
  );
}

// Simplified line-art gopuram (temple tower) silhouette — a generic,
// non-specific architectural motif, not a depiction of this temple's actual
// gopuram (which has never been photographed for this project).
export function GopuramSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.9">
        <path d="M100 8 L114 26 L86 26 Z" />
        <rect x="70" y="26" width="60" height="18" rx="2" />
        <path d="M62 44 L138 44 L128 64 L72 64 Z" />
        <rect x="66" y="64" width="68" height="20" rx="2" />
        <path d="M56 84 L144 84 L132 108 L68 108 Z" />
        <rect x="60" y="108" width="80" height="22" rx="2" />
        <path d="M50 130 L150 130 L136 158 L64 158 Z" />
        <rect x="44" y="158" width="112" height="26" rx="2" />
        <rect x="30" y="184" width="140" height="46" rx="3" />
        <path d="M70 230 L70 184 M100 230 L100 184 M130 230 L130 184" />
        <path d="M30 200 L170 200" />
      </g>
    </svg>
  );
}

// Subtle kolam-inspired dot/line motif for section separators.
export function OrnamentalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden="true">
      <span className="h-px w-10 bg-current opacity-40" />
      <LotusIcon className="h-4 w-4" />
      <span className="h-px w-10 bg-current opacity-40" />
    </div>
  );
}

// Full decorative panel standing in for a real photograph (hero, history).
// Flat fills only — no gradients — so it reads as a deliberate illustrated
// plate rather than a loading state.
export function PlaceholderPanel({
  className = "",
  tone = "warm",
}: {
  className?: string;
  tone?: "warm" | "deep";
}) {
  const bg = tone === "deep" ? "bg-primary" : "bg-surface-muted";
  const iconColor = tone === "deep" ? "text-gold-light/90" : "text-primary/60";
  return (
    <div className={`relative overflow-hidden ${bg} ${className}`}>
      <div className={`pattern-kolam absolute inset-0 ${tone === "deep" ? "opacity-[0.14]" : "opacity-[0.22]"}`} />
      <div className="relative flex h-full w-full items-end justify-center px-8 pt-10">
        <GopuramSilhouette className={`h-[82%] w-auto ${iconColor}`} />
      </div>
    </div>
  );
}

// Smaller square/round tile standing in for a deity/news photo.
export function PlaceholderTile({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-surface-muted ${className}`}>
      <div className="pattern-kolam absolute inset-0 opacity-20" />
      <LotusIcon className="relative h-1/2 max-h-24 w-1/2 max-w-24 text-primary/55" />
    </div>
  );
}

// Arched shrine-niche frame — the site's signature image shape. Renders the
// real image when one exists, otherwise the matching placeholder, so callers
// don't each repeat the image/placeholder branch.
export function ArchFrame({
  src,
  alt,
  className = "",
  tone = "warm",
  variant = "panel",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  tone?: "warm" | "deep";
  variant?: "panel" | "tile";
}) {
  return (
    <div className={`arch relative outline outline-1 outline-offset-[6px] outline-gold/50 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : variant === "tile" ? (
        <PlaceholderTile className="h-full w-full" />
      ) : (
        <PlaceholderPanel tone={tone} className="h-full w-full" />
      )}
    </div>
  );
}
