"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

interface Deity {
  id: string;
  name_en: string;
  image: string | null;
  sortOrder: number;
  status: "active" | "inactive";
}

// Mirrors CommitteeOrderTable's move() pattern: swap the two adjacent rows'
// sortOrder values via two PATCH calls, then refresh.
export default function DeityOrderTable({ deities }: { deities: Deity[] }) {
  const router = useRouter();
  const sorted = [...deities].sort((a, b) => a.sortOrder - b.sortOrder);

  async function move(id: string, direction: -1 | 1) {
    const idx = sorted.findIndex((d) => d.id === id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/deities/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
      }),
      fetch(`/api/admin/deities/${swapWith.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder: sorted[idx].sortOrder }),
      }),
    ]);
    router.refresh();
  }

  return (
    <AdminTableCard>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="admin-thead">
            <th className="px-4 py-3">Photo</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, idx) => (
            <tr key={d.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
              <td className="px-4 py-3">
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-surface-muted" />
                )}
              </td>
              <td className="px-4 py-3 font-medium text-text-primary">{d.name_en}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 text-center text-text-secondary">{d.sortOrder}</span>
                  <button
                    type="button"
                    onClick={() => move(d.id, -1)}
                    disabled={idx === 0}
                    aria-label={`Move ${d.name_en} up`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(d.id, 1)}
                    disabled={idx === sorted.length - 1}
                    aria-label={`Move ${d.name_en} down`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={d.status} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/deities/${d.id}`} className="admin-link">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                No deities yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableCard>
  );
}
