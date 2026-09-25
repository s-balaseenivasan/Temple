"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminTableCard from "@/components/admin-table-card";

interface Designation {
  id: string;
  name_en: string;
  name_ta: string | null;
  active: boolean;
  sortOrder: number;
}

export default function DesignationManager({ initial }: { initial: Designation[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(d: Designation) {
    await fetch(`/api/admin/designations/${d.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    router.refresh();
  }

  async function remove(d: Designation) {
    setError(null);
    const res = await fetch(`/api/admin/designations/${d.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail ?? "Delete failed.");
      return;
    }
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/designations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name_en: form.get("name_en"),
        name_ta: form.get("name_ta") || undefined,
        sortOrder: form.get("sortOrder") || 0,
      }),
    });
    if (!res.ok) {
      setError("Create failed.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  const inputClass = "admin-input w-auto";

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="admin-panel flex flex-wrap items-end gap-2 p-4 text-sm">
        <input name="name_en" aria-label="Designation (English)" placeholder="Designation (English)" required className={inputClass} />
        <input name="name_ta" aria-label="Designation (Tamil, optional)" placeholder="Designation (Tamil, optional)" className={inputClass} />
        <input name="sortOrder" type="number" aria-label="Order" placeholder="Order" defaultValue={0} className={`w-20 ${inputClass}`} />
        <button type="submit" className="btn btn-primary btn-sm">
          Add Designation
        </button>
      </form>

      {error && <p className="text-sm text-error">{error}</p>}

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Name (TA)</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((d) => (
              <tr key={d.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{d.name_en}</td>
                <td className="font-tamil px-4 py-3 text-text-secondary">{d.name_ta}</td>
                <td className="px-4 py-3 text-text-secondary">{d.sortOrder}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(d)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${d.active ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"}`}
                  >
                    {d.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(d)} className="font-medium text-error hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
