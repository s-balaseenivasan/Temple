import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { generateReport, reportToCsv, type ReportGranularity } from "@/lib/reports";
import { generateReportPdf } from "@/lib/report-pdf";

// FEAT-058/059: export mirrors exactly what's on screen (same filters/params).
// "Excel" export is CSV, not a .xlsx binary — see IMPLEMENTATION_PROGRESS.md
// for why: the `xlsx` npm package carries unpatched high-severity
// vulnerabilities (prototype pollution, ReDoS), and CSV opens correctly in
// Excel/Sheets/LibreOffice without that dependency risk. Same practical
// outcome for the admin, safer dependency footprint.
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const sp = req.nextUrl.searchParams;
  const granularity = (sp.get("granularity") ?? "daily") as ReportGranularity;
  const format = sp.get("format") ?? "csv";
  const reportParams = {
    granularity,
    date: sp.get("date") ?? undefined,
    month: sp.get("month") ?? undefined,
    year: sp.get("year") ?? undefined,
    fy: sp.get("fy") ?? undefined,
  };

  const result = await generateReport(reportParams);

  // RULE-DM-004: donation/report export is an audited action, entityId NULL
  // (bulk export, not one entity) with the filter criteria in afterJson.
  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "EXPORT",
      entityType: "Donation",
      afterJson: { ...reportParams, format },
    },
  });

  if (format === "pdf") {
    const pdfBytes = await generateReportPdf(result);
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${granularity}-report.pdf"`,
      },
    });
  }

  const csv = reportToCsv(result);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": `attachment; filename="${granularity}-report.csv"`,
    },
  });
}
