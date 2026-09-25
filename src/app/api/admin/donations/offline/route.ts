import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { offlineDonationSchema } from "@/lib/validation/donation";
import { allocateReceiptNumber, financialYearStartYear } from "@/lib/receipt";
import { generateReceiptPdf } from "@/lib/receipt-pdf";

// EP-46 / RULE-041 / RULE-SEC-44 / PERM-024: admin-recorded offline or in-kind
// donation. Deliberately the ONLY other code path (besides the webhook) that
// may create a Donation at status=success directly — available to Temple
// Admin AND Super Admin (not Super-Admin-only, since this is an operational
// task, not a security-sensitive one).
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = offlineDonationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const purpose = await prisma.donationPurpose.findUnique({ where: { id: data.purposeId } });
  if (!purpose) {
    return NextResponse.json({ error: "invalid_purpose" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.create({
      data: {
        donorName: data.donorName,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address || null,
        pan: data.pan ? data.pan.toUpperCase() : null,
        amount: data.amount,
        purposeId: data.purposeId,
        anonymous: data.anonymous,
        donationType: data.donationType,
        valuationNote: data.valuationNote ?? null,
        recordedByAdminId: session.user.id,
        status: "success", // RULE-041: offline/in-kind goes straight to success, no pending
      },
    });

    const fy = financialYearStartYear(new Date());
    const receiptNumber = await allocateReceiptNumber(tx, fy); // RULE-DM-003: shared ledger

    const settings = await tx.siteSettings.findFirst();

    const receipt = await tx.receipt.create({
      data: {
        donationId: donation.id,
        receiptNumber,
        issuedByAdminId: session.user.id,
        includes80GClause: settings?.is80GRegistered ?? false,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE",
        entityType: "Donation",
        entityId: donation.id,
        afterJson: { donationType: data.donationType, amount: data.amount, receiptNumber },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "RECEIPT_ISSUE",
        entityType: "Receipt",
        entityId: receipt.id,
      },
    });

    return { donation, receipt, settings, purpose };
  });

  try {
    const pdfBytes = await generateReceiptPdf({
      templeName: result.settings?.templeName_en ?? "Temple",
      templeAddress: result.settings?.addressLine_en ?? "",
      receiptNumber: result.receipt.receiptNumber,
      donorName: result.donation.donorName,
      mobile: result.donation.mobile,
      amount: result.donation.amount.toString(),
      purpose: result.purpose.name_en,
      donationType: result.donation.donationType,
      issuedAt: result.receipt.issuedAt,
      includes80GClause: result.receipt.includes80GClause,
      registration80GNumber: result.settings?.registration80GNumber,
    });
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data", "receipts");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${result.receipt.id}.pdf`), pdfBytes);
  } catch (err) {
    console.error("Offline-donation receipt PDF generation failed:", err);
  }

  return NextResponse.json({
    donationId: result.donation.id,
    receiptId: result.receipt.id,
    receiptNumber: result.receipt.receiptNumber,
  });
}
