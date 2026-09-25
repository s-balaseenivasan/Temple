"use client";

import { useRouter, useSearchParams } from "next/navigation";

function formatRupees(value: string): string {
  return Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ReportResult {
  title: string;
  rangeLabel: string;
  rows: { label: string; count: number; total: string }[];
  grandTotal: string;
  grandCount: number;
}

export default function ReportView({
  granularity,
  params,
  currentFy,
  result,
}: {
  granularity: "daily" | "monthly" | "yearly" | "purpose";
  params: { date?: string; month?: string; year?: string; fy?: string };
  currentFy: number;
  result: ReportResult;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setGranularity(g: string) {
    router.push(`/admin/reports?granularity=${g}`);
  }

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("granularity", granularity);
    next.set(key, value);
    router.push(`/admin/reports?${next.toString()}`);
  }

  const exportUrl = (format: "csv" | "pdf") => {
    const qs = new URLSearchParams({ granularity, format, ...(params.date ? { date: params.date } : {}), ...(params.month ? { month: params.month } : {}), ...(params.year ? { year: params.year } : {}), ...(params.fy ? { fy: params.fy } : {}) });
    return `/api/admin/reports/export?${qs.toString()}`;
  };

  const inputClass = "admin-input w-auto";

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
        {["daily", "monthly", "yearly", "purpose"].map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`rounded-full px-3.5 py-1.5 font-medium capitalize transition-colors ${granularity === g ? "bg-primary text-white" : "text-text-secondary hover:text-primary"}`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="admin-panel flex flex-wrap items-end gap-3 p-4 text-sm">
        {granularity === "daily" && (
          <div>
            <label htmlFor="report-date" className="mb-1 block text-xs font-medium text-text-secondary">Date</label>
            <input
              id="report-date"
              type="date"
              defaultValue={params.date}
              onChange={(e) => updateParam("date", e.target.value)}
              className={inputClass}
              // Microsoft Edge's native date-input chrome applies its own
              // `caret-color` inline style to this element outside of React's
              // control, which React's hydration check flags as a mismatch
              // even though nothing in this component ever sets that style —
              // confirmed via the exact wording of the dev warning ("can also
              // happen if the client has a browser extension... which messes
              // with the HTML") and by the report's actual computed total
              // being correct throughout. suppressHydrationWarning is React's
              // documented escape hatch for exactly this class of
              // browser-injected, non-app-controlled attribute difference.
              suppressHydrationWarning
            />
          </div>
        )}
        {granularity === "monthly" && (
          <>
            <div>
              <label htmlFor="report-month" className="mb-1 block text-xs font-medium text-text-secondary">Month</label>
              <input id="report-month" type="number" min={1} max={12} defaultValue={params.month} onChange={(e) => updateParam("month", e.target.value)} className={`w-20 ${inputClass}`} />
            </div>
            <div>
              <label htmlFor="report-year" className="mb-1 block text-xs font-medium text-text-secondary">Year</label>
              <input id="report-year" type="number" defaultValue={params.year} onChange={(e) => updateParam("year", e.target.value)} className={`w-24 ${inputClass}`} />
            </div>
          </>
        )}
        {(granularity === "yearly" || granularity === "purpose") && (
          <div>
            <label htmlFor="report-fy" className="mb-1 block text-xs font-medium text-text-secondary">Financial Year (start year)</label>
            <input id="report-fy" type="number" defaultValue={params.fy ?? currentFy} onChange={(e) => updateParam("fy", e.target.value)} className={`w-24 ${inputClass}`} />
          </div>
        )}

        <a href={exportUrl("csv")} className="btn btn-outline btn-sm">
          Export Excel (CSV)
        </a>
        <a href={exportUrl("pdf")} className="btn btn-outline btn-sm">
          Export PDF
        </a>
      </div>

      <div className="admin-panel p-5">
        <h2 className="mb-1 text-lg font-semibold text-primary">{result.title}</h2>
        <p className="mb-4 text-sm text-text-secondary">{result.rangeLabel}</p>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="admin-thead">
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.label} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{r.label}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.count}</td>
                  <td className="px-4 py-3 text-text-primary">₹{formatRupees(r.total)}</td>
                </tr>
              ))}
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                    No successful donations in this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-surface-muted/40 font-semibold">
                <td className="px-4 py-3 text-text-primary">Grand Total</td>
                <td className="px-4 py-3 text-text-primary">{result.grandCount}</td>
                <td className="px-4 py-3 text-primary">₹{formatRupees(result.grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
