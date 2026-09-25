import type { NextRequest } from "next/server";

// Hardening-pass addition (blueprint IMPLEMENTATION_HANDOFF.md step 7):
// throttles the two public POST endpoints with no other cost to an attacker
// — donation creation and member-request submission. Deliberately a simple
// in-process sliding-window counter, not a Redis-backed one: this is a
// single small temple site running one Node process, not a multi-instance
// deployment behind a load balancer, so an in-memory map is an honest,
// proportionate choice — ASSUMPTION, flagged the same way FEAT-074's
// threshold was, not a claim this scales to a clustered deployment. If the
// app is ever horizontally scaled, this must move to a shared store (Redis)
// since each process would otherwise keep its own independent counters.
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateLimitResult {
  const windowStart = now - windowMs;
  const existing = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (existing.length >= limit) {
    const oldest = existing[0];
    buckets.set(key, existing);
    return { allowed: false, remaining: 0, retryAfterMs: oldest + windowMs - now };
  }

  existing.push(now);
  buckets.set(key, existing);
  return { allowed: true, remaining: limit - existing.length, retryAfterMs: 0 };
}

// Exported for tests only, so each test starts from a clean slate rather
// than leaking state across the shared module-level map.
export function _resetRateLimitStoreForTests(): void {
  buckets.clear();
}

// IMPORTANT, honestly documented rather than silently assumed: `x-forwarded-for`
// is a client-suppliable header. This function only produces a trustworthy
// value when the app sits behind a reverse proxy/CDN that overwrites (not
// appends to) this header before the request reaches Next.js — true on most
// managed hosting (e.g. Vercel), false on a bare Node server exposed
// directly to the internet, where an attacker can send a fresh fake value
// on every request and trivially bypass this limiter entirely. This app has
// no documented production deployment target yet (see CR-001/payment-gateway
// notes elsewhere), so this is flagged as a real, load-bearing ASSUMPTION —
// re-verify which hosting is actually used before relying on this in
// production, not just in this local/dev environment.
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
