"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminTableCard from "@/components/admin-table-card";
import StatusBadge from "@/components/status-badge";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "SuperAdmin" | "TempleAdmin";
  status: "active" | "inactive";
  lastLoginAt: string | null;
}

export default function UserManager({
  initialUsers,
  activeSuperAdminCount,
}: {
  initialUsers: AdminUserRow[];
  activeSuperAdminCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        role: form.get("role"),
        password: form.get("password"),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error === "duplicate_email" ? "That email is already in use." : "Could not create account.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function toggleStatus(u: AdminUserRow) {
    setError(null);
    const nextStatus = u.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail ?? "Could not update status.");
      return;
    }
    router.refresh();
  }

  const inputClass = "admin-input w-auto";

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="admin-panel grid grid-cols-2 gap-3 p-5 text-sm">
        <input name="name" aria-label="Full name" placeholder="Full name" required className={inputClass} />
        <input name="email" type="email" aria-label="Email" placeholder="Email" required className={inputClass} />
        <input name="phone" aria-label="Phone (optional)" placeholder="Phone (optional)" className={inputClass} />
        <select name="role" required aria-label="Role" className={inputClass}>
          <option value="TempleAdmin">Temple Admin</option>
          <option value="SuperAdmin">Super Admin</option>
        </select>
        <input
          name="password"
          type="password"
          aria-label="Initial password (min 8 chars)"
          placeholder="Initial password (min 8 chars)"
          required
          minLength={8}
          className={`col-span-2 ${inputClass}`}
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-sm col-span-2"
        >
          {submitting ? "Creating..." : "Create Admin Account"}
        </button>
        {error && <p className="col-span-2 text-error">{error}</p>}
      </form>

      <AdminTableCard>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="admin-thead">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((u) => {
              const isOnlyActiveSuperAdmin = u.role === "SuperAdmin" && u.status === "active" && activeSuperAdminCount <= 1;
              return (
                <tr key={u.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-background/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.role}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "Never"}</td>
                  <td className="flex gap-3 px-4 py-3">
                    <a href={`/admin/users/${u.id}`} className="admin-link">
                      Edit
                    </a>
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={isOnlyActiveSuperAdmin && u.status === "active"}
                      title={isOnlyActiveSuperAdmin ? "Cannot deactivate the only remaining active Super Admin" : undefined}
                      className="admin-link disabled:cursor-not-allowed disabled:text-text-secondary/40 disabled:no-underline"
                    >
                      {u.status === "active" ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  );
}
