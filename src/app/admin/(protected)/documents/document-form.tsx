"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";

interface DocumentItem {
  id: string;
  title_en: string;
  title_ta: string | null;
  category: string;
  fileUrl: string;
  publishedDate: string;
  sortOrder: number;
  status: "draft" | "published";
}

const CATEGORIES = [
  { value: "registration_info", label: "Registration Info" },
  { value: "bylaws", label: "Bylaws" },
  { value: "agm_report", label: "AGM Report" },
  { value: "annual_activity_report", label: "Annual Activity Report" },
  { value: "public_notice", label: "Public Notice" },
];

export default function DocumentForm({ existing }: { existing?: DocumentItem }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      title_en: form.get("title_en"),
      title_ta: form.get("title_ta") || undefined,
      category: form.get("category"),
      fileUrl: form.get("fileUrl"),
      publishedDate: form.get("publishedDate"),
      sortOrder: form.get("sortOrder") || 0,
    };

    const url = existing ? `/api/admin/documents/${existing.id}` : "/api/admin/documents";
    const method = existing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) setErrors(body.details.fieldErrors);
      else setFormError("Save failed.");
      return;
    }

    if (existing) {
      setMessage("Saved.");
      router.refresh();
    } else {
      const created = await res.json();
      router.push(`/admin/documents/${created.id}`);
    }
  }

  async function togglePublish() {
    if (!existing) return;
    const nextStatus = existing.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/documents/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="rounded-xl border border-gold/60 bg-gold-light/15 p-3 text-sm text-primary-dark">
        ⚠️ Do not upload internal, personal-member, or legally-sensitive documents here — this repository is public.
      </p>

      <form onSubmit={handleSubmit} className="admin-panel space-y-4">
        <BilingualField label="Title" nameEn="title_en" nameTa="title_ta" defaultValueEn={existing?.title_en} defaultValueTa={existing?.title_ta} error={errors.title_en} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="doc-category" className="admin-label">Category *</label>
            <select id="doc-category" name="category" required defaultValue={existing?.category ?? "public_notice"} className="admin-input">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doc-published-date" className="admin-label">Published Date *</label>
            <input id="doc-published-date" type="date" name="publishedDate" required defaultValue={existing?.publishedDate?.slice(0, 10)} className="admin-input" />
          </div>
        </div>

        <div>
          <label htmlFor="doc-file-url" className="admin-label">File URL (PDF) *</label>
          <input id="doc-file-url" name="fileUrl" required defaultValue={existing?.fileUrl} className="admin-input" />
          {errors.fileUrl?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
        </div>

        <div>
          <label htmlFor="doc-sort-order" className="admin-label">Sort Order</label>
          <input id="doc-sort-order" type="number" name="sortOrder" defaultValue={existing?.sortOrder ?? 0} className="admin-input w-32" />
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          {submitting ? "Saving..." : existing ? "Save Changes" : "Create Draft"}
        </button>
        {message && <span className="ml-3 text-sm text-success">{message}</span>}
      </form>

      {existing && (
        <div className="admin-panel text-sm">
          <p className="mb-2">
            Current status: <span className="font-medium">{existing.status}</span>
          </p>
          <button onClick={togglePublish} className="btn btn-outline btn-xs">
            {existing.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      )}
    </div>
  );
}
