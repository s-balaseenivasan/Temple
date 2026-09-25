import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CommitteeOrderTable from "./committee-order-table";

export default async function AdminCommitteeListPage() {
  const members = await prisma.committeeMember.findMany({
    orderBy: { displayOrder: "asc" },
    include: { designation: true },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="admin-title">Committee Members</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/designations"
            className="btn btn-outline btn-sm"
          >
            Manage Designations
          </Link>
          <Link
            href="/admin/committee/new"
            className="btn btn-primary btn-sm"
          >
            + New Member
          </Link>
        </div>
      </div>

      <CommitteeOrderTable members={members} />
    </div>
  );
}
