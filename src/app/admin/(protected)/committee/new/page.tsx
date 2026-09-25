import { prisma } from "@/lib/prisma";
import MemberForm from "../member-form";

export default async function NewMemberPage() {
  // Sequential, not Promise.all — the local `prisma dev` database was found
  // (via real testing, see IMPLEMENTATION_ENVIRONMENT.md) to be unreliable
  // under even 2 truly-concurrent queries from this adapter's connection pool.
  const designations = await prisma.designation.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const memberCount = await prisma.committeeMember.count();
  return (
    <div>
      <h1 className="admin-title mb-6">New Committee Member</h1>
      <MemberForm designations={designations} nextDisplayOrder={memberCount} />
    </div>
  );
}
