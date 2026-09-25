import { generateReport } from "@/lib/reports";
import { financialYearStartYear } from "@/lib/receipt";
import ReportView from "./report-view";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ granularity?: string; date?: string; month?: string; year?: string; fy?: string }>;
}) {
  const sp = await searchParams;
  const granularity = (sp.granularity ?? "daily") as "daily" | "monthly" | "yearly" | "purpose";
  const currentFy = financialYearStartYear(new Date());

  const result = await generateReport({
    granularity,
    date: sp.date,
    month: sp.month,
    year: sp.year,
    fy: sp.fy,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="admin-title mb-6">Donation Reports</h1>
      <ReportView
        granularity={granularity}
        params={{ date: sp.date, month: sp.month, year: sp.year, fy: sp.fy }}
        currentFy={currentFy}
        result={result}
      />
    </div>
  );
}
