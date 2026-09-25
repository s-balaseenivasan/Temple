import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import EditUserForm from "./edit-user-form";

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "SuperAdmin") redirect("/admin?error=forbidden");

  const { id } = await params;
  const user = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
  });
  if (!user) notFound();

  return (
    <div className="max-w-md">
      <h1 className="admin-title mb-6">Edit Admin User</h1>
      <EditUserForm user={user} />
    </div>
  );
}
