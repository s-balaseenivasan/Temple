import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// FEAT-041/042: status polling for the success/failure/processing page.
// Only returns the minimal fields needed by that page — never the full donor
// record — since the donation `id` (a UUID) is treated as an unguessable
// short-lived token here, not an authenticated-owner check.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amount: true,
      donationType: true,
      receipt: { select: { receiptNumber: true, id: true } },
    },
  });

  if (!donation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(donation);
}
