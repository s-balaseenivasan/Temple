import type { Prisma } from "@/generated/prisma/client";

/**
 * RULE-008: financial-year start-year convention (CONFIRMED — Apr 1 to Mar 31).
 * A date of 2026-02-10 falls in FY 2025-26, so this returns 2025, not 2026.
 */
export function financialYearStartYear(date: Date): number {
  const month = date.getUTCMonth(); // 0 = January
  const year = date.getUTCFullYear();
  return month >= 3 ? year : year - 1; // April = index 3
}

/**
 * RULE-DM-003: transactionally-safe, FY-scoped, unique + monotonic receipt
 * numbering — ONE shared ledger across cash_online (webhook-triggered) and
 * offline/in-kind (admin-recorded) donations. Must be called inside the same
 * Prisma transaction that creates the Receipt row.
 *
 * Concurrency safety: the upsert's ON CONFLICT DO UPDATE is a single atomic
 * row-level operation in Postgres — two concurrent transactions racing on the
 * same `fy` will serialize on that row's lock, so no two callers can ever
 * observe/claim the same sequence value.
 */
export async function allocateReceiptNumber(
  tx: Prisma.TransactionClient,
  fy: number,
): Promise<string> {
  const counter = await tx.receiptCounter.upsert({
    where: { fy },
    create: { fy, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seq = counter.lastSeq.toString().padStart(6, "0");
  return `DON-${fy}-${seq}`;
}
