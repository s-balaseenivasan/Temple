import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { generateReceiptPdf } from "@/lib/receipt-pdf";

// FEAT-049 / RULE-011 / RULE-013: reissue only ever regenerates the PDF —
// receiptNumber, donationId, issuedAt are immutable and are never touched here.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const { id } = await params;

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: { donation: { include: { purpose: true } } },
  });
  if (!receipt) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const settings = await prisma.siteSettings.findFirst();

  const pdfBytes = await generateReceiptPdf({
    templeName: settings?.templeName_en ?? "Temple",
    templeAddress: settings?.addressLine_en ?? "",
    receiptNumber: receipt.receiptNumber, // immutable — never reallocated
    donorName: receipt.donation.donorName,
    mobile: receipt.donation.mobile,
    amount: receipt.donation.amount.toString(),
    purpose: receipt.donation.purpose.name_en,
    donationType: receipt.donation.donationType,
    issuedAt: receipt.issuedAt, // immutable — original issue date, not now()
    includes80GClause: receipt.includes80GClause, // snapshot at original issuance, not re-derived
    registration80GNumber: settings?.registration80GNumber,
  });

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".data", "receipts");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${receipt.id}.pdf`), pdfBytes);

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "RECEIPT_REISSUE",
      entityType: "Receipt",
      entityId: receipt.id,
    },
  });

  return NextResponse.json({ ok: true, receiptNumber: receipt.receiptNumber });
}
