import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeityOrderTable from "./deity-order-table";

export default async function AdminDeitiesListPage() {
  const deities = await prisma.deity.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="admin-title">Deities</h1>
        <Link
          href="/admin/deities/new"
          className="btn btn-primary btn-sm"
        >
          + New Deity
        </Link>
      </div>

      <DeityOrderTable deities={deities} />
    </div>
  );
}
