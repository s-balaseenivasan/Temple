import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";
import { z } from "zod";

const createSchema = z.object({
  name_en: z.string().trim().min(1),
  name_ta: z.string().trim().optional(),
  sortOrder: z.coerce.number().default(0),
});

// FEAT-050: Temple Admin + Super Admin CRUD.
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const purpose = await prisma.donationPurpose.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "CREATE", entityType: "DonationPurpose", entityId: purpose.id, afterJson: parsed.data },
  });

  return NextResponse.json(purpose, { status: 201 });
}
