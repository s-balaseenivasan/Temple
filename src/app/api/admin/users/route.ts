import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  role: z.enum(["SuperAdmin", "TempleAdmin"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// FEAT-066 / RULE-027 / PERM: only Super Admin can create admin accounts of
// either role — Temple Admin has no access to this endpoint at all.
export async function GET() {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "duplicate_email" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      passwordHash,
      status: "active",
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE",
      entityType: "AdminUser",
      entityId: user.id,
      afterJson: { name: user.name, email: user.email, role: user.role },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
