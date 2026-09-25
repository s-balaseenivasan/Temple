import { describe, it, expect } from "vitest";
import { pick, isFallback } from "./i18n";

// RULE-017: bilingual fallback — the public site must NEVER render a blank
// field. This is the rule the stakeholder specifically flagged mid-session
// (single-language rendering, Tamil default), so it gets direct test coverage.
describe("pick (RULE-017 bilingual fallback)", () => {
  it("returns Tamil when locale is 'ta' and a Tamil value exists", () => {
    expect(pick("Hello", "வணக்கம்", "ta")).toBe("வணக்கம்");
  });

  it("falls back to English when locale is 'ta' but the Tamil value is null", () => {
    expect(pick("Hello", null, "ta")).toBe("Hello");
  });

  it("falls back to English when locale is 'ta' but the Tamil value is an empty string", () => {
    expect(pick("Hello", "", "ta")).toBe("Hello");
  });

  it("falls back to English when locale is 'ta' but the Tamil value is only whitespace", () => {
    expect(pick("Hello", "   ", "ta")).toBe("Hello");
  });

  it("always returns English when locale is 'en', even if a Tamil value exists", () => {
    expect(pick("Hello", "வணக்கம்", "en")).toBe("Hello");
  });
});

describe("isFallback (RULE-017 fallback indicator)", () => {
  it("is true when locale is Tamil and no Tamil value exists", () => {
    expect(isFallback(null, "ta")).toBe(true);
    expect(isFallback("", "ta")).toBe(true);
  });

  it("is false when locale is Tamil and a Tamil value exists", () => {
    expect(isFallback("வணக்கம்", "ta")).toBe(false);
  });

  it("is false when locale is English regardless of Tamil value", () => {
    expect(isFallback(null, "en")).toBe(false);
  });
});
