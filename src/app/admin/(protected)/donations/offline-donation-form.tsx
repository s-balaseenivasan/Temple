"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export default function OfflineDonationForm({ purposes }: { purposes: { id: string; name_en: string }[] }) {
  const router = useRouter();
  const [donationType, setDonationType] = useState("cash_offline");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/donations/offline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        donorName: form.get("donorName"),
        mobile: form.get("mobile"),
        amount: form.get("amount"),
        purposeId: form.get("purposeId"),
        donationType: form.get("donationType"),
        valuationNote: form.get("valuationNote") || undefined,
        anonymous: false,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.details ? JSON.stringify(body.details.fieldErrors) : "Failed to record donation.");
      return;
    }
    const json = await res.json();
    setMessage(`Recorded. Receipt: ${json.receiptNumber}`);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  const inputClass =
    "admin-input h-11 placeholder:text-text-secondary/60";
  const labelClass = "mb-1.5 block text-xs font-medium text-text-secondary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="offline-donor-name" className={labelClass}>
            Donor Name
          </label>
          <input id="offline-donor-name" name="donorName" aria-label="Donor name" placeholder="Full name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="offline-mobile" className={labelClass}>
            Mobile
          </label>
          <input id="offline-mobile" name="mobile" aria-label="Mobile" placeholder="10-digit mobile number" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="offline-amount" className={labelClass}>
            Amount
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-text-secondary">
              ₹
            </span>
            <input
              id="offline-amount"
              name="amount"
              type="number"
              aria-label="Amount (₹)"
              placeholder="Enter amount"
              required
              className={`${inputClass} pl-7`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="offline-purpose" className={labelClass}>
            Purpose
          </label>
          <select id="offline-purpose" name="purposeId" required aria-label="Donation purpose" className={inputClass}>
            {purposes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
        <div>
          <label htmlFor="offline-donation-type" className={labelClass}>
            Donation Type
          </label>
          <select
            id="offline-donation-type"
            name="donationType"
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
            aria-label="Donation type"
            className={inputClass}
          >
            <option value="cash_offline">Cash (offline)</option>
            <option value="in_kind_goods">In-kind: Goods</option>
            <option value="in_kind_land">In-kind: Land</option>
          </select>
        </div>
        <div className="flex sm:justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-md disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Recording..." : "Record Donation"}
          </button>
        </div>
      </div>

      {donationType !== "cash_offline" && (
        <div>
          <label htmlFor="offline-valuation-note" className={labelClass}>
            Valuation Note
          </label>
          <input
            id="offline-valuation-note"
            name="valuationNote"
            aria-label="Valuation note (required for in-kind)"
            placeholder="Describe and estimate the value of the in-kind contribution"
            required
            className={inputClass}
          />
        </div>
      )}

      {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
      {error && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
    </form>
  );
}
