import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Content-Security-Policy — the "without nonces" variant Next.js's own docs
// recommend for apps that don't want every page forced into dynamic
// rendering (a nonce-based strict CSP requires that; see
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// This is a deliberate, documented middle ground, not an oversight:
// - `script-src`/`style-src` need 'unsafe-inline' because Next.js emits
//   inline hydration-payload <script> tags on every page (confirmed by
//   inspecting real rendered HTML during this project's verification work)
//   and there is no nonce plumbing in place to avoid it. This means the
//   policy does NOT fully stop an already-successful inline-script XSS
//   injection — it stops loading of *external* malicious scripts/styles
//   (script-src/style-src 'self' still rejects a `<script src="https://evil.example/x.js">`),
//   clickjacking (frame-ancestors), and restricts embeddable frames to only
//   YouTube (FEAT-009's iframe embeds) and Google Maps (FEAT-011's map
//   embed on the Contact page).
// - `img-src` allows any `https:` origin, not just 'self' — admins can enter
//   arbitrary external image URLs for gallery photos, album covers,
//   committee photos, and news featured images (no upload pipeline exists;
//   see DATA_MODEL.md), so restricting to 'self' would break real,
//   legitimate admin-entered content.
// - `'unsafe-eval'` is dev-only (Turbopack/React dev-mode needs it for
//   source-mapped error stacks); production builds don't need or get it.
// Re-verify this policy specifically (not just re-run the existing test
// suite) if a real production hosting target is chosen and nonce-based CSP
// becomes worth the dynamic-rendering cost — flagged in
// IMPLEMENTATION_PROGRESS.md as a named follow-up, not silently finalized.
function buildCsp(): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Dev-only exclusion: this directive upgrades http: sub-resource (and in
    // some browsers, navigational) requests to https: — correct and wanted
    // in production, but the local dev server is plain HTTP on localhost
    // with no TLS listener at all, so this would break every request when
    // testing locally.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: buildCsp() },
          // HSTS only outside dev (the local dev server is plain HTTP).
          ...(process.env.NODE_ENV === "development"
            ? []
            : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
