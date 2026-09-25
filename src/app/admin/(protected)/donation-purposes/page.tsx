import { prisma } from "@/lib/prisma";
import PurposeManager from "./purpose-manager";

export default async function AdminDonationPurposesPage() {
  const purposes = await prisma.donationPurpose.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="admin-title mb-6">Donation Purposes</h1>
      <PurposeManager
        initialPurposes={purposes.map((p) => ({
          id: p.id,
          name_en: p.name_en,
          name_ta: p.name_ta,
          active: p.active,
          sortOrder: p.sortOrder,
        }))}
      />
    </div>
  );
}
