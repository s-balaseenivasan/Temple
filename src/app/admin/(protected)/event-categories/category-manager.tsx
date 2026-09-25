"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminTableCard from "@/components/admin-table-card";

interface Category {
  id: string;
  name_en: string;
  name_ta: string | null;
  active: boolean;
}

export default function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(c: Category) {
    await fetch(`/api/admin/event-categories/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    router.refresh();
  }

  async function remove(c: Category) {
    setError(null);
    const res = await fetch(`/api/admin/event-categories/${c.id}`, { method: "DELETE" });
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
    const res = await fetch("/api/admin/event-categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name_en: form.get("name_en"), name_ta: form.get("name_ta") || undefined }),
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
        <input name="name_en" aria-label="Category (English)" placeholder="Category (English)" required className={inputClass} />
        <input name="name_ta" aria-label="Category (Tamil, optional)" placeholder="Category (Tamil, optional)" className={inputClass} />
        <button type="submit" className="btn btn-primary btn-sm">
          Add Category
        </button>
      </form>

      {error && <p className="text-sm text-error">{error}</p>}

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Name (EN)</th>
              <th className="px-4 py-3">Name (TA)</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                <td className="px-4 py-3 font-medium text-text-primary">{c.name_en}</td>
                <td className="font-tamil px-4 py-3 text-text-secondary">{c.name_ta}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${c.active ? "bg-success/10 text-success" : "bg-surface-muted text-text-secondary"}`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(c)} className="font-medium text-error hover:underline">
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
