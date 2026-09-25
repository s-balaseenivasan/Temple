import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MemberForm from "../member-form";

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [member, designations] = await Promise.all([
    prisma.committeeMember.findUnique({ where: { id } }),
    prisma.designation.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!member) notFound();

  return (
    <div>
      <h1 className="admin-title mb-6">Edit Committee Member</h1>
      <MemberForm existing={member} designations={designations} />
    </div>
  );
}
