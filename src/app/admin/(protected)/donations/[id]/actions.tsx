"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DonationDetailActions({
  donationId,
  receiptId,
  status,
  isSuperAdmin,
}: {
  donationId: string;
  receiptId: string | null;
  status: string;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reissue() {
    if (!receiptId) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/receipts/${receiptId}/reissue`, { method: "POST" });
    setBusy(false);
    setMessage(res.ok ? "Receipt PDF regenerated (same receipt number)." : "Reissue failed.");
  }

  async function refund() {
    const reason = window.prompt("Refund reason (required for audit):");
    if (!reason) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/donations/${donationId}/refund`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage("Donation marked refunded.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMessage(body.detail ?? "Refund failed.");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {receiptId && (
        <>
          <a
            href={`/api/receipts/${receiptId}/pdf`}
            className="btn btn-outline btn-xs"
          >
            Download PDF
          </a>
          <button
            onClick={reissue}
            disabled={busy}
            className="btn btn-xs border border-border text-text-secondary hover:bg-surface-muted"
          >
            Reissue / Regenerate PDF
          </button>
        </>
      )}
      {status === "success" && isSuperAdmin && (
        <button
          onClick={refund}
          disabled={busy}
          className="btn btn-xs btn-danger"
        >
          Mark Refunded (Super Admin)
        </button>
      )}
      {status === "success" && !isSuperAdmin && (
        <p className="text-xs text-text-secondary">Refunds require a Super Admin.</p>
      )}
      {message && <p className="w-full text-xs text-success">{message}</p>}
    </div>
  );
}
