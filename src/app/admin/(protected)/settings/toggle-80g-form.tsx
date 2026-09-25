"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Toggle80gForm({
  is80GRegistered,
  registration80GNumber,
}: {
  is80GRegistered: boolean;
  registration80GNumber: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/settings/80g", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        is80GRegistered: form.get("is80GRegistered") === "on",
        registration80GNumber: form.get("registration80GNumber") || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not update.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel max-w-2xl space-y-3 text-sm">
      <h2 className="font-semibold text-primary">80G Tax Exemption (Super Admin only)</h2>
      <label className="flex items-center gap-2 text-text-secondary">
        <input type="checkbox" name="is80GRegistered" defaultChecked={is80GRegistered} className="h-4 w-4" />
        Temple is 80G registered — print the tax-exemption clause on future receipts
      </label>
      <div>
        <label htmlFor="registration80GNumber" className="admin-label">80G Registration Number</label>
        <input
          id="registration80GNumber"
          name="registration80GNumber"
          defaultValue={registration80GNumber ?? ""}
          className="admin-input"
        />
      </div>
      <p className="text-xs text-text-secondary">
        Only affects receipts issued after this change — already-issued receipts are not retroactively reprinted.
      </p>
      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
