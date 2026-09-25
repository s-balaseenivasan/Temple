import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface ReceiptPdfInput {
  templeName: string;
  templeAddress: string;
  receiptNumber: string;
  donorName: string;
  mobile: string;
  amount: string;
  purpose: string;
  donationType: string;
  issuedAt: Date;
  includes80GClause: boolean;
  registration80GNumber?: string | null;
}

/**
 * Server-side PDF receipt generation (TECHNICAL_ARCHITECTURE.md §5 recommendation:
 * pdf-lib). Note field is a plain-language description; Latin-only StandardFonts
 * are used here (pdf-lib's built-in fonts do not support Tamil glyphs) — the
 * receipt is generated in English. Bilingual PDF rendering (an embedded Tamil
 * font) is a real gap, tracked in IMPLEMENTATION_PROGRESS.md, not silently
 * dropped.
 */
export async function generateReceiptPdf(input: ReceiptPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 560]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let y = 520;
  const draw = (text: string, opts: { size?: number; bold?: boolean; x?: number } = {}) => {
    page.drawText(text, {
      x: opts.x ?? 40,
      y,
      size: opts.size ?? 11,
      font: opts.bold ? font : regular,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= (opts.size ?? 11) + 8;
  };

  draw(input.templeName, { size: 15, bold: true });
  draw(input.templeAddress, { size: 9 });
  y -= 8;
  draw("DONATION RECEIPT", { size: 13, bold: true });
  y -= 4;
  draw(`Receipt No: ${input.receiptNumber}`, { bold: true });
  draw(`Date: ${input.issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`);
  y -= 8;
  draw(`Donor: ${input.donorName}`);
  draw(`Mobile: ${input.mobile}`);
  draw(`Amount: Rs. ${input.amount}`);
  draw(`Purpose: ${input.purpose}`);
  draw(`Donation Type: ${input.donationType}`);
  y -= 8;

  if (input.includes80GClause) {
    draw("This donation is eligible for tax exemption under Section 80G", { size: 9 });
    if (input.registration80GNumber) {
      draw(`80G Registration No: ${input.registration80GNumber}`, { size: 9 });
    }
    y -= 4;
  }

  draw("Thank you for supporting the temple.", { size: 10 });

  return doc.save();
}
