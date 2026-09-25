import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ReportResult } from "@/lib/reports";

export async function generateReportPdf(result: ReportResult): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 600]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let y = 560;
  const draw = (text: string, opts: { size?: number; bold?: boolean; x?: number } = {}) => {
    page.drawText(text, {
      x: opts.x ?? 40,
      y,
      size: opts.size ?? 10,
      font: opts.bold ? bold : regular,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= (opts.size ?? 10) + 8;
  };

  draw(result.title, { size: 14, bold: true });
  draw(result.rangeLabel, { size: 10 });
  y -= 8;
  draw("Label", { x: 40, bold: true });
  page.drawText("Count", { x: 220, y: y + 18, size: 10, font: bold });
  page.drawText("Total (INR)", { x: 300, y: y + 18, size: 10, font: bold });
  y -= 4;

  for (const row of result.rows) {
    page.drawText(row.label, { x: 40, y, size: 10, font: regular });
    page.drawText(String(row.count), { x: 220, y, size: 10, font: regular });
    page.drawText(row.total, { x: 300, y, size: 10, font: regular });
    y -= 18;
  }

  y -= 8;
  page.drawText("Grand Total", { x: 40, y, size: 10, font: bold });
  page.drawText(String(result.grandCount), { x: 220, y, size: 10, font: bold });
  page.drawText(result.grandTotal, { x: 300, y, size: 10, font: bold });

  return doc.save();
}
