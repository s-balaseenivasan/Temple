"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "SuperAdmin" | "TempleAdmin";
  status: "active" | "inactive";
}

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone") || undefined,
        role: form.get("role"),
        newPassword: form.get("newPassword") || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail ?? "Update failed.");
      return;
    }
    setMessage("Saved.");
    (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[name="newPassword"]')!.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel space-y-4 text-sm">
      <div>
        <label htmlFor="edit-user-email" className="admin-label">Email (not editable)</label>
        <input id="edit-user-email" value={user.email} disabled className="admin-input bg-surface-muted text-text-secondary" />
      </div>
      <div>
        <label htmlFor="edit-user-name" className="admin-label">Name</label>
        <input id="edit-user-name" name="name" required defaultValue={user.name} className="admin-input" />
      </div>
      <div>
        <label htmlFor="edit-user-phone" className="admin-label">Phone</label>
        <input id="edit-user-phone" name="phone" defaultValue={user.phone ?? ""} className="admin-input" />
      </div>
      <div>
        <label htmlFor="edit-user-role" className="admin-label">Role</label>
        <select id="edit-user-role" name="role" defaultValue={user.role} className="admin-input">
          <option value="TempleAdmin">Temple Admin</option>
          <option value="SuperAdmin">Super Admin</option>
        </select>
      </div>
      <div>
        <label htmlFor="edit-user-password" className="admin-label">Reset Password (optional, min 8 chars)</label>
        <input id="edit-user-password" name="newPassword" type="password" minLength={8} className="admin-input" />
      </div>

      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
