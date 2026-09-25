import { prisma } from "@/lib/prisma";
import DesignationManager from "./designation-manager";

export default async function AdminDesignationsPage() {
  const designations = await prisma.designation.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Committee Designations</h1>
      <DesignationManager
        initial={designations.map((d) => ({ id: d.id, name_en: d.name_en, name_ta: d.name_ta, active: d.active, sortOrder: d.sortOrder }))}
      />
    </div>
  );
}
