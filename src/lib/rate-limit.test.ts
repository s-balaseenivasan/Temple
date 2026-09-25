import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimitStoreForTests } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitStoreForTests();
  });

  it("allows requests up to the limit, then blocks the next one", () => {
    const key = "test-key-1";
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000, 1000);
      expect(result.allowed).toBe(true);
    }
    const sixth = checkRateLimit(key, 5, 60_000, 1000);
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  it("allows a request again once the window has slid past the oldest hit", () => {
    const key = "test-key-2";
    checkRateLimit(key, 2, 10_000, 0);
    checkRateLimit(key, 2, 10_000, 1000);
    const blocked = checkRateLimit(key, 2, 10_000, 2000);
    expect(blocked.allowed).toBe(false);

    // Advance past the window from the first hit (t=0, window 10s) — the
    // first hit ages out, freeing one slot.
    const afterWindow = checkRateLimit(key, 2, 10_000, 10_001);
    expect(afterWindow.allowed).toBe(true);
  });

  it("tracks separate keys (e.g. separate IPs) independently", () => {
    checkRateLimit("ip-a", 1, 60_000, 0);
    const ipA = checkRateLimit("ip-a", 1, 60_000, 100);
    const ipB = checkRateLimit("ip-b", 1, 60_000, 100);
    expect(ipA.allowed).toBe(false);
    expect(ipB.allowed).toBe(true);
  });

  it("reports a positive retryAfterMs when blocked", () => {
    const key = "test-key-3";
    checkRateLimit(key, 1, 5000, 0);
    const blocked = checkRateLimit(key, 1, 5000, 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(4000); // oldest hit (t=0) + window (5000) - now (1000)
  });
});
