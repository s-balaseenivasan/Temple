import { prisma } from "@/lib/prisma";
import { financialYearStartYear } from "@/lib/receipt";
import type { Prisma } from "@/generated/prisma/client";

export type ReportGranularity = "daily" | "monthly" | "yearly" | "purpose";

export interface ReportParams {
  granularity: ReportGranularity;
  date?: string; // daily: YYYY-MM-DD
  month?: string; // monthly: 1-12
  year?: string; // monthly: YYYY
  fy?: string; // yearly/purpose: FY start year, e.g. "2025"
  from?: string; // purpose: optional custom range
  to?: string;
}

export interface ReportRow {
  label: string;
  count: number;
  total: string;
}

export interface ReportResult {
  title: string;
  rangeLabel: string;
  rows: ReportRow[];
  grandTotal: string;
  grandCount: number;
}

// RULE-038: only status='success' counts toward "total raised" figures;
// pending/failed excluded; refunded shown/handled separately (net effect not
// modeled — refunded donations are excluded from totals here since the money
// was returned, which is the more auditor-defensible default absent an
// explicit blueprint instruction otherwise — flagged as an ASSUMPTION).
function dateRangeFor(params: ReportParams): { gte: Date; lt: Date; title: string; rangeLabel: string } {
  if (params.granularity === "daily") {
    const date = params.date ? new Date(params.date) : new Date();
    const gte = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
    return { gte, lt, title: "Daily Donation Report", rangeLabel: gte.toLocaleDateString("en-IN") };
  }
  if (params.granularity === "monthly") {
    const year = params.year ? Number(params.year) : new Date().getUTCFullYear();
    const month = params.month ? Number(params.month) - 1 : new Date().getUTCMonth();
    const gte = new Date(Date.UTC(year, month, 1));
    const lt = new Date(Date.UTC(year, month + 1, 1));
    return { gte, lt, title: "Monthly Donation Report", rangeLabel: gte.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  }
  // yearly / purpose: RULE-008 FY convention — start-year, April to March.
  const fy = params.fy ? Number(params.fy) : financialYearStartYear(new Date());
  const gte = new Date(Date.UTC(fy, 3, 1)); // April 1
  const lt = new Date(Date.UTC(fy + 1, 3, 1)); // next April 1
  return {
    gte,
    lt,
    title: params.granularity === "purpose" ? "Purpose-wise Donation Report" : "Yearly Donation Report",
    rangeLabel: `FY ${fy}-${(fy + 1).toString().slice(2)}`,
  };
}

export async function generateReport(params: ReportParams): Promise<ReportResult> {
  const { gte, lt, title, rangeLabel } = dateRangeFor(params);

  const where: Prisma.DonationWhereInput = {
    status: "success",
    createdAt: { gte, lt },
  };

  if (params.granularity === "purpose") {
    const grouped = await prisma.donation.groupBy({
      by: ["purposeId"],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });
    const purposes = await prisma.donationPurpose.findMany({ where: { id: { in: grouped.map((g) => g.purposeId) } } });
    const rows: ReportRow[] = grouped.map((g) => {
      const purpose = purposes.find((p) => p.id === g.purposeId);
      return {
        label: purpose?.name_en ?? "Unknown",
        count: g._count._all,
        total: Number(g._sum.amount ?? 0).toFixed(2),
      };
    });
    const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
    const grandCount = rows.reduce((sum, r) => sum + r.count, 0);
    return { title, rangeLabel, rows, grandTotal: grandTotal.toFixed(2), grandCount };
  }

  // daily/monthly/yearly: single aggregate row plus a per-day/per-month breakdown could be added later;
  // for now, a straightforward total-for-the-period plus a donation-type breakdown (RULE-DM-003: shared
  // ledger across cash_online and offline/in-kind, so both are included here).
  const grouped = await prisma.donation.groupBy({
    by: ["donationType"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });
  const rows: ReportRow[] = grouped.map((g) => ({
    label: g.donationType,
    count: g._count._all,
    total: Number(g._sum.amount ?? 0).toFixed(2),
  }));
  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
  const grandCount = rows.reduce((sum, r) => sum + r.count, 0);
  return { title, rangeLabel, rows, grandTotal: grandTotal.toFixed(2), grandCount };
}

export function reportToCsv(result: ReportResult): string {
  const lines = [
    `"${result.title}"`,
    `"${result.rangeLabel}"`,
    "",
    "Label,Count,Total (INR)",
    ...result.rows.map((r) => `"${r.label}",${r.count},${r.total}`),
    `"Grand Total",${result.grandCount},${result.grandTotal}`,
  ];
  return lines.join("\r\n");
}
