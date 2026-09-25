import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

// FEAT-046: public (post-lookup) + admin download. Public access here relies
// on the receipt `id` being an unguessable UUID (not sequential) — the actual
// lookup step that reveals this id is already gated by RULE-016's compound
// mobile+receiptNumber match in /api/receipts/lookup.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const receipt = await prisma.receipt.findUnique({ where: { id } });
  if (!receipt) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const filePath = path.join(process.cwd(), ".data", "receipts", `${receipt.id}.pdf`);
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/pdf",
        // FEAT-046 calls this a "Download" action — attachment (not inline)
        // so clicking it actually saves the file, especially important on
        // mobile where an inline PDF view is a poor experience.
        "content-disposition": `attachment; filename="${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "pdf_not_available" }, { status: 404 });
  }
}
