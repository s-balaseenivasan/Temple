import { describe, it, expect } from "vitest";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "./password-reset";

describe("generateResetToken", () => {
  it("generates a random hex token whose hash matches hashResetToken", () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashResetToken(token));
  });

  it("generates a different token on every call (not deterministic/reused)", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("sets an expiry in the future, matching the documented TTL", () => {
    const before = Date.now();
    const { expiresAt } = generateResetToken();
    const after = Date.now();
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + RESET_TOKEN_TTL_MS);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + RESET_TOKEN_TTL_MS);
  });
});

describe("hashResetToken", () => {
  it("is deterministic — the same token always hashes to the same value", () => {
    const token = "a".repeat(64);
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashResetToken("a".repeat(64))).not.toBe(hashResetToken("b".repeat(64)));
  });
});
