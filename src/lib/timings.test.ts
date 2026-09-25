import { describe, it, expect } from "vitest";
import { resolveTimings } from "./timings";

describe("resolveTimings (FEAT-010 override precedence)", () => {
  const standard = {
    morning: { open: "06:00", close: "12:00" },
    evening: { open: "16:00", close: "20:00" },
  };

  it("returns standard timings when no override matches today", () => {
    const result = resolveTimings(
      { ...standard, specialDayOverrides: [{ date: "2026-01-01", open: "05:00", close: "22:00" }] },
      new Date("2026-06-15T00:00:00Z"),
    );
    expect(result.activeOverride).toBeNull();
    expect(result.standard).toEqual(standard);
  });

  it("returns the override, not the standard timings, when today matches an override date", () => {
    const result = resolveTimings(
      { ...standard, specialDayOverrides: [{ date: "2026-06-15", open: "05:00", close: "22:00", note_en: "Festival day" }] },
      new Date("2026-06-15T00:00:00Z"),
    );
    expect(result.standard).toBeNull();
    expect(result.activeOverride).toEqual({ date: "2026-06-15", open: "05:00", close: "22:00", note_en: "Festival day" });
  });

  it("handles a completely empty timingsJson gracefully", () => {
    const result = resolveTimings({}, new Date("2026-06-15T00:00:00Z"));
    expect(result.standard).toBeNull();
    expect(result.activeOverride).toBeNull();
  });

  it("picks the correct override among several by exact date match", () => {
    const result = resolveTimings(
      {
        ...standard,
        specialDayOverrides: [
          { date: "2026-06-14", open: "01:00", close: "02:00" },
          { date: "2026-06-15", open: "05:00", close: "22:00" },
          { date: "2026-06-16", open: "03:00", close: "04:00" },
        ],
      },
      new Date("2026-06-15T00:00:00Z"),
    );
    expect(result.activeOverride?.open).toBe("05:00");
  });
});
