import { describe, it, expect } from "vitest";
import { financialYearStartYear } from "./receipt";

// RULE-008: financial-year start-year convention (CONFIRMED — Apr 1 to Mar 31).
// This is the single most important date calculation in the whole donation
// module — every receipt number depends on it — so it gets a real regression
// test, not just the ad-hoc curl checks used during initial development.
describe("financialYearStartYear (RULE-008)", () => {
  it("a date in January belongs to the PREVIOUS calendar year's FY", () => {
    // 2026-02-10 falls in FY 2025-26 (Apr 2025 - Mar 2026) -> start year 2025
    expect(financialYearStartYear(new Date(Date.UTC(2026, 1, 10)))).toBe(2025);
  });

  it("March 31 (last day of the FY) still belongs to the FY that started the previous April", () => {
    expect(financialYearStartYear(new Date(Date.UTC(2026, 2, 31)))).toBe(2025);
  });

  it("April 1 (first day of a new FY) belongs to the FY starting that same year", () => {
    expect(financialYearStartYear(new Date(Date.UTC(2026, 3, 1)))).toBe(2026);
  });

  it("a date in December belongs to the FY that started the same calendar year", () => {
    expect(financialYearStartYear(new Date(Date.UTC(2026, 11, 25)))).toBe(2026);
  });
});
