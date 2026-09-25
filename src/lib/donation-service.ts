import { prisma } from "@/lib/prisma";
import { allocateReceiptNumber, financialYearStartYear } from "@/lib/receipt";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import type { PaymentProviderName } from "@/generated/prisma/enums";

/**
 * RULE-012/RULE-SEC-10: the ONLY place a Donation is ever flipped to `success`
 * for the cash_online path. Called from the real webhook route AND (in mock
 * mode) directly by the mock-gateway resolver — never from a client redirect.
 *
 * RULE-SEC-12: idempotent — a duplicate/replayed webhook for an
 * already-terminal Payment is a safe no-op, never a second Receipt.
 */
export async function processPaymentWebhookEvent(input: {
  provider: PaymentProviderName;
  providerOrderId: string;
  providerPaymentId: string;
  outcome: "success" | "failed";
  rawPayload: unknown;
}) {
  const payment = await prisma.payment.findUnique({
    where: { provider_providerOrderId: { provider: input.provider, providerOrderId: input.providerOrderId } },
    include: { donation: true },
  });

  if (!payment) {
    return { ok: false as const, reason: "unknown_order" };
  }

  // Idempotency: a terminal payment never transitions again (RULE-014, forbidden transitions).
  if (payment.status !== "initiated") {
    return { ok: true as const, idempotentNoop: true };
  }

  if (input.outcome === "failed") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed", providerPaymentId: input.providerPaymentId, rawWebhookPayload: input.rawPayload as object },
      }),
      prisma.donation.update({
        where: { id: payment.donationId },
        data: { status: "failed" },
      }),
      prisma.auditLog.create({
        data: {
          actorId: null,
          action: "WEBHOOK_VERIFIED",
          entityType: "Payment",
          entityId: payment.id,
          afterJson: { outcome: "failed" },
        },
      }),
    ]);
    return { ok: true as const, outcome: "failed" as const };
  }

  // RULE-021: amount tampering protection — verify against the server-known
  // Donation.amount, never a client- or webhook-supplied amount.
  const donation = payment.donation;

  const result = await prisma.$transaction(async (tx) => {
    // Re-check inside the transaction in case of a race between two verifying calls.
    const freshPayment = await tx.payment.findUnique({ where: { id: payment.id } });
    if (!freshPayment || freshPayment.status !== "initiated") {
      return { alreadyTerminal: true as const };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "success",
        providerPaymentId: input.providerPaymentId,
        verifiedAt: new Date(),
        rawWebhookPayload: input.rawPayload as object,
      },
    });

    await tx.donation.update({
      where: { id: donation.id },
      data: { status: "success" },
    });

    const fy = financialYearStartYear(new Date());
    const receiptNumber = await allocateReceiptNumber(tx, fy);

    const settings = await tx.siteSettings.findFirst();
    const includes80GClause = settings?.is80GRegistered ?? false;

    const receipt = await tx.receipt.create({
      data: {
        donationId: donation.id,
        receiptNumber,
        includes80GClause,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: null,
        action: "WEBHOOK_VERIFIED",
        entityType: "Payment",
        entityId: payment.id,
        afterJson: { outcome: "success", receiptNumber },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: null,
        action: "RECEIPT_ISSUE",
        entityType: "Receipt",
        entityId: receipt.id,
      },
    });

    return { alreadyTerminal: false as const, receipt, settings };
  });

  if (result.alreadyTerminal) {
    return { ok: true as const, idempotentNoop: true };
  }

  // PDF generation is decoupled from the success transition (RULE-DM: a
  // successful payment must never be blocked on PDF rendering succeeding).
  try {
    const purpose = await prisma.donationPurpose.findUnique({ where: { id: donation.purposeId } });
    const pdfBytes = await generateReceiptPdf({
      templeName: result.settings?.templeName_en ?? "Temple",
      templeAddress: result.settings?.addressLine_en ?? "",
      receiptNumber: result.receipt.receiptNumber,
      donorName: donation.donorName,
      mobile: donation.mobile,
      amount: donation.amount.toString(),
      purpose: purpose?.name_en ?? "General",
      donationType: donation.donationType,
      issuedAt: result.receipt.issuedAt,
      includes80GClause: result.receipt.includes80GClause,
      registration80GNumber: result.settings?.registration80GNumber,
    });
    // Local-disk fallback store (see IMPLEMENTATION_PROGRESS.md — S3 not yet wired).
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data", "receipts");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${result.receipt.id}.pdf`);
    await writeFile(filePath, pdfBytes);
    await prisma.receipt.update({ where: { id: result.receipt.id }, data: { pdfUrl: `/local-receipts/${result.receipt.id}` } });
  } catch (err) {
    console.error("Receipt PDF generation failed (donation still successful):", err);
  }

  return { ok: true as const, outcome: "success" as const, receiptNumber: result.receipt.receiptNumber };
}
