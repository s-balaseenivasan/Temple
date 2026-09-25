"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ["in_review", "rejected"],
  in_review: ["completed", "rejected", "new"],
  completed: [],
  rejected: ["new"],
};

export default function RequestActions({
  requestId,
  status,
  adminNotes,
}: {
  requestId: string;
  status: string;
  adminNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function changeStatus(nextStatus: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/member-requests/${requestId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage(body.detail ?? "Status change failed.");
    }
  }

  async function saveNotes() {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/member-requests/${requestId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adminNotes: notes }),
    });
    setBusy(false);
    setMessage(res.ok ? "Notes saved." : "Failed to save notes.");
  }

  const allowedNext = ALLOWED_TRANSITIONS[status] ?? [];

  return (
    <div className="admin-panel text-sm">
      <h2 className="mb-2 font-semibold text-text-secondary">Internal Notes (not shown to submitter)</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="admin-input mb-2"
      />
      <button onClick={saveNotes} disabled={busy} className="btn btn-xs mb-4 border border-border text-text-secondary hover:bg-surface-muted">
        Save Notes
      </button>

      <h2 className="mb-2 font-semibold text-text-secondary">Status</h2>
      <div className="flex gap-2">
        {allowedNext.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            disabled={busy}
            className="btn btn-outline btn-xs"
          >
            Move to &quot;{s}&quot;
          </button>
        ))}
        {allowedNext.length === 0 && <p className="text-xs text-text-secondary">No further transitions from this state.</p>}
      </div>
      {message && <p className="mt-2 text-xs text-text-secondary">{message}</p>}
    </div>
  );
}
