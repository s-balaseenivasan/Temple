import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DeityForm from "../deity-form";

export default async function EditDeityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deity = await prisma.deity.findUnique({ where: { id } });
  if (!deity) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Deity</h1>
      <DeityForm existing={deity} />
    </div>
  );
}
