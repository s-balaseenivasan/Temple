import { prisma } from "@/lib/prisma";
import DeityForm from "../deity-form";

export default async function NewDeityPage() {
  const deityCount = await prisma.deity.count();
  return (
    <div>
      <h1 className="admin-title mb-6">New Deity</h1>
      <DeityForm nextSortOrder={deityCount} />
    </div>
  );
}
