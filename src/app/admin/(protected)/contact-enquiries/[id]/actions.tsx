"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALL_STATUSES = ["new", "responded", "closed"];

export default function EnquiryActions({ enquiryId, status }: { enquiryId: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function changeStatus(nextStatus: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/contact-enquiries/${enquiryId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMessage("Status change failed.");
    }
  }

  return (
    <div className="admin-panel text-sm">
      <h2 className="mb-2 font-semibold text-text-secondary">Status</h2>
      <div className="flex gap-2">
        {ALL_STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            disabled={busy}
            className="btn btn-outline btn-xs"
          >
            Mark &quot;{s}&quot;
          </button>
        ))}
      </div>
      {message && <p className="mt-2 text-xs text-error">{message}</p>}
    </div>
  );
}
