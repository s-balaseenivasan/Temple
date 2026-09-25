"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

interface Member {
  id: string;
  name_en: string;
  designation: { name_en: string };
  mobile: string;
  displayOrder: number;
  status: "active" | "inactive";
}

// FEAT-032: dedicated reorder UI — the PATCH-with-displayOrder endpoint
// already existed and was verified via direct API calls during the earlier
// edit-form/reorder re-verification sweep, but no UI ever called it. Mirrors
// the exact working pattern already shipped for gallery photos
// (photo-manager.tsx's `move()`): swap the two adjacent rows' displayOrder
// values via two PATCH calls, then refresh. Up/Down buttons rather than
// native HTML5 drag-and-drop deliberately — drag-and-drop has no built-in
// keyboard equivalent, and this project just finished a full accessibility
// pass; buttons work identically for mouse, touch, and keyboard users.
export default function CommitteeOrderTable({ members }: { members: Member[] }) {
  const router = useRouter();
  const sorted = [...members].sort((a, b) => a.displayOrder - b.displayOrder);

  async function move(id: string, direction: -1 | 1) {
    const idx = sorted.findIndex((m) => m.id === id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/committee/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayOrder: swapWith.displayOrder }),
      }),
      fetch(`/api/admin/committee/${swapWith.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayOrder: sorted[idx].displayOrder }),
      }),
    ]);
    router.refresh();
  }

  return (
    <AdminTableCard>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="admin-thead">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Designation</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, idx) => (
            <tr key={m.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
              <td className="px-4 py-3 font-medium text-text-primary">{m.name_en}</td>
              <td className="px-4 py-3 text-text-secondary">{m.designation.name_en}</td>
              <td className="px-4 py-3 text-text-secondary">{m.mobile}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 text-center text-text-secondary">{m.displayOrder}</span>
                  <button
                    type="button"
                    onClick={() => move(m.id, -1)}
                    disabled={idx === 0}
                    aria-label={`Move ${m.name_en} up`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(m.id, 1)}
                    disabled={idx === sorted.length - 1}
                    aria-label={`Move ${m.name_en} down`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/committee/${m.id}`} className="admin-link">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                No committee members yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableCard>
  );
}
