import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { generateReport, type ReportGranularity } from "@/lib/reports";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const sp = req.nextUrl.searchParams;
  const granularity = (sp.get("granularity") ?? "daily") as ReportGranularity;

  const result = await generateReport({
    granularity,
    date: sp.get("date") ?? undefined,
    month: sp.get("month") ?? undefined,
    year: sp.get("year") ?? undefined,
    fy: sp.get("fy") ?? undefined,
  });

  return NextResponse.json(result);
}
