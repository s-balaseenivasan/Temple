import { prisma } from "@/lib/prisma";
import CategoryManager from "./category-manager";

export default async function AdminEventCategoriesPage() {
  const categories = await prisma.eventCategory.findMany({ orderBy: { name_en: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Event Categories</h1>
      <CategoryManager initial={categories.map((c) => ({ id: c.id, name_en: c.name_en, name_ta: c.name_ta, active: c.active }))} />
    </div>
  );
}
