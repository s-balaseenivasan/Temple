import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/reports";

// Integration test against the real local dev database (not mocked) — the
// only way to genuinely verify RULE-008's FY boundary and RULE-038's
// status-inclusion rule inside generateReport()'s actual Prisma queries,
// not just the pure date-math already covered by receipt.test.ts. Creates
// and tears down its own uniquely-named fixtures so it's safe to rerun and
// doesn't collide with seed data or other test runs.
describe("generateReport (RULE-008 FY boundary, RULE-038 status inclusion)", () => {
  const suffix = Date.now();
  const purposeName = `Report Test Purpose ${suffix}`;
  let purposeId: string;
  const donationIds: string[] = [];

  beforeAll(async () => {
    const purpose = await prisma.donationPurpose.create({
      data: { name_en: purposeName, active: true },
    });
    purposeId = purpose.id;
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({ where: { id: { in: donationIds } } });
    await prisma.donationPurpose.delete({ where: { id: purposeId } });
  });

  async function makeDonation(amount: string, status: "success" | "pending" | "failed" | "refunded", createdAt: Date) {
    const donation = await prisma.donation.create({
      data: {
        donorName: "Report Test Donor",
        mobile: "9812340009",
        amount,
        purposeId,
        status,
        donationType: "cash_offline",
        createdAt,
      },
    });
    donationIds.push(donation.id);
    return donation;
  }

  // generateReport()'s daily/monthly/yearly granularities deliberately
  // aggregate by donationType ACROSS THE WHOLE DATABASE for the queried
  // range (that's the real "how much did we raise this month" behavior,
  // not scoped to one purpose) — so each test case below uses its own
  // widely-separated, never-reused historical year to stay isolated from
  // both real seed/manual-testing data and the other test cases in this
  // file, rather than relying on purposeId scoping (which only the
  // "purpose" granularity actually applies).

  it("monthly report includes only donations within that calendar month, and excludes non-success statuses (RULE-038)", async () => {
    const year = 1999;
    const month = 6; // June
    await makeDonation("250.00", "success", new Date(Date.UTC(year, month - 1, 15)));
    await makeDonation("9999.00", "pending", new Date(Date.UTC(year, month - 1, 16))); // must be excluded
    await makeDonation("9999.00", "success", new Date(Date.UTC(year, month - 2, 28))); // previous month, excluded
    await makeDonation("9999.00", "success", new Date(Date.UTC(year, month, 1))); // next month, excluded

    const result = await generateReport({ granularity: "monthly", year: String(year), month: String(month) });
    const ourRow = result.rows.find((r) => r.label === "cash_offline");
    expect(ourRow?.total).toBe("250.00");
    expect(ourRow?.count).toBe(1);
  });

  it("yearly (FY) report follows the April start-year boundary (RULE-008) and excludes the prior FY's March donation", async () => {
    const fy = 2005; // FY 2005-06: 2005-04-01 to 2006-03-31
    await makeDonation("100.00", "success", new Date(Date.UTC(fy, 3, 1))); // April 1 — inside this FY
    await makeDonation("9999.00", "success", new Date(Date.UTC(fy, 2, 31))); // March 31 — previous FY, excluded
    await makeDonation("9999.00", "success", new Date(Date.UTC(fy + 1, 3, 1))); // next FY's April 1, excluded

    const result = await generateReport({ granularity: "yearly", fy: String(fy) });
    const ourRow = result.rows.find((r) => r.label === "cash_offline");
    expect(ourRow?.total).toBe("100.00");
    expect(ourRow?.count).toBe(1);
    expect(result.rangeLabel).toBe("FY 2005-06");
  });

  it("purpose-wise report aggregates by DonationPurpose and matches the sum of only the success-status rows created for our test purpose", async () => {
    const fy = 2010;
    await makeDonation("300.00", "success", new Date(Date.UTC(fy, 5, 1)));
    await makeDonation("450.00", "success", new Date(Date.UTC(fy, 8, 1)));
    await makeDonation("9999.00", "failed", new Date(Date.UTC(fy, 8, 2))); // excluded

    const result = await generateReport({ granularity: "purpose", fy: String(fy) });
    const ourRow = result.rows.find((r) => r.label === purposeName);
    expect(ourRow?.total).toBe("750.00");
    expect(ourRow?.count).toBe(2);
  });
});
