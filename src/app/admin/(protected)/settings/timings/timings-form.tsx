"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Override {
  date: string;
  open: string;
  close: string;
  note_en?: string;
  note_ta?: string;
}

interface TimingsData {
  morning: { open: string; close: string };
  evening: { open: string; close: string };
  specialDayOverrides: Override[];
}

const EMPTY: TimingsData = {
  morning: { open: "06:00", close: "12:00" },
  evening: { open: "16:00", close: "20:00" },
  specialDayOverrides: [],
};

export default function TimingsForm({ initial }: { initial: Partial<TimingsData> }) {
  const router = useRouter();
  const [data, setData] = useState<TimingsData>({
    morning: initial.morning ?? EMPTY.morning,
    evening: initial.evening ?? EMPTY.evening,
    specialDayOverrides: initial.specialDayOverrides ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addOverride() {
    setData((d) => ({ ...d, specialDayOverrides: [...d.specialDayOverrides, { date: "", open: "", close: "", note_en: "" }] }));
  }

  function updateOverride(idx: number, field: keyof Override, value: string) {
    setData((d) => ({
      ...d,
      specialDayOverrides: d.specialDayOverrides.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
    }));
  }

  function removeOverride(idx: number) {
    setData((d) => ({ ...d, specialDayOverrides: d.specialDayOverrides.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/settings/timings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.details?.formErrors?.join?.(", ") || body?.error?.message || "Could not save — check for duplicate override dates.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel max-w-2xl space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <fieldset className="space-y-2">
          <legend className="font-medium text-text-secondary">Morning</legend>
          <label htmlFor="morning-open" className="mb-1 block text-xs font-medium text-text-secondary">Open</label>
          <input id="morning-open" type="time" value={data.morning.open} onChange={(e) => setData((d) => ({ ...d, morning: { ...d.morning, open: e.target.value } }))} className="admin-input" />
          <label htmlFor="morning-close" className="mb-1 block text-xs font-medium text-text-secondary">Close</label>
          <input id="morning-close" type="time" value={data.morning.close} onChange={(e) => setData((d) => ({ ...d, morning: { ...d.morning, close: e.target.value } }))} className="admin-input" />
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="font-medium text-text-secondary">Evening</legend>
          <label htmlFor="evening-open" className="mb-1 block text-xs font-medium text-text-secondary">Open</label>
          <input id="evening-open" type="time" value={data.evening.open} onChange={(e) => setData((d) => ({ ...d, evening: { ...d.evening, open: e.target.value } }))} className="admin-input" />
          <label htmlFor="evening-close" className="mb-1 block text-xs font-medium text-text-secondary">Close</label>
          <input id="evening-close" type="time" value={data.evening.close} onChange={(e) => setData((d) => ({ ...d, evening: { ...d.evening, close: e.target.value } }))} className="admin-input" />
        </fieldset>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium text-text-secondary">Special-Day Overrides</h2>
          <button type="button" onClick={addOverride} className="btn btn-outline btn-xs">
            + Add Override
          </button>
        </div>
        <div className="space-y-2">
          {data.specialDayOverrides.map((o, idx) => (
            <div key={idx} className="grid grid-cols-5 items-end gap-2 rounded-xl border border-border p-2">
              <div>
                <label htmlFor={`override-date-${idx}`} className="mb-1 block text-xs font-medium text-text-secondary">Date</label>
                <input id={`override-date-${idx}`} type="date" value={o.date} onChange={(e) => updateOverride(idx, "date", e.target.value)} className="admin-input" />
              </div>
              <div>
                <label htmlFor={`override-open-${idx}`} className="mb-1 block text-xs font-medium text-text-secondary">Open</label>
                <input id={`override-open-${idx}`} type="time" value={o.open} onChange={(e) => updateOverride(idx, "open", e.target.value)} className="admin-input" />
              </div>
              <div>
                <label htmlFor={`override-close-${idx}`} className="mb-1 block text-xs font-medium text-text-secondary">Close</label>
                <input id={`override-close-${idx}`} type="time" value={o.close} onChange={(e) => updateOverride(idx, "close", e.target.value)} className="admin-input" />
              </div>
              <div>
                <label htmlFor={`override-note-${idx}`} className="mb-1 block text-xs font-medium text-text-secondary">Note (optional)</label>
                <input id={`override-note-${idx}`} value={o.note_en ?? ""} onChange={(e) => updateOverride(idx, "note_en", e.target.value)} className="admin-input" />
              </div>
              <button type="button" onClick={() => removeOverride(idx)} className="text-error">
                Remove
              </button>
            </div>
          ))}
          {data.specialDayOverrides.length === 0 && <p className="text-text-secondary">No overrides configured.</p>}
        </div>
      </div>

      {error && <p className="text-error">{error}</p>}
      {message && <p className="text-success">{message}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : "Save Timings"}
      </button>
    </form>
  );
}
