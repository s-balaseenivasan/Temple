import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import bcrypt from "bcryptjs";
import { z } from "zod";

const statusSchema = z.object({ status: z.enum(["active", "inactive"]) });

const updateSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  role: z.enum(["SuperAdmin", "TempleAdmin"]),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

// FEAT-068 / RULE-028/029: deactivate/reactivate only — never a hard delete
// (RULE-033). Blocks deactivating the last remaining active Super Admin,
// including that admin acting on themself, to prevent total lockout.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireSuperAdmin();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  // Status-only toggle (existing behavior).
  if (body && typeof body === "object" && "status" in body && Object.keys(body).length === 1) {
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.status === "inactive" && target.role === "SuperAdmin") {
      const activeSuperAdminCount = await prisma.adminUser.count({ where: { role: "SuperAdmin", status: "active" } });
      if (activeSuperAdminCount <= 1) {
        return NextResponse.json(
          { error: "last_super_admin", detail: "Cannot deactivate the only remaining active Super Admin." },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: parsed.data.status === "inactive" ? "DEACTIVATE" : "UPDATE",
        entityType: "AdminUser",
        entityId: id,
        beforeJson: { status: target.status },
        afterJson: { status: updated.status },
      },
    });

    return NextResponse.json(updated);
  }

  // FEAT-067: general field edit (name/phone/role/optional password reset).
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  // RULE-029-style safeguard: don't allow downgrading the last active Super Admin's role away from SuperAdmin.
  if (target.role === "SuperAdmin" && parsed.data.role !== "SuperAdmin") {
    const activeSuperAdminCount = await prisma.adminUser.count({ where: { role: "SuperAdmin", status: "active" } });
    if (activeSuperAdminCount <= 1) {
      return NextResponse.json(
        { error: "last_super_admin", detail: "Cannot change the role of the only remaining active Super Admin." },
        { status: 409 },
      );
    }
  }

  const data: { name: string; phone: string | null; role: "SuperAdmin" | "TempleAdmin"; passwordHash?: string } = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
  };
  if (parsed.data.newPassword) {
    data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "AdminUser",
      entityId: id,
      beforeJson: { name: target.name, phone: target.phone, role: target.role },
      afterJson: { name: updated.name, phone: updated.phone, role: updated.role, passwordChanged: !!parsed.data.newPassword },
    },
  });

  return NextResponse.json(updated);
}
