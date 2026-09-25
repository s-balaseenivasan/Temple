"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface Entry {
  id: string;
  year: string;
  title_en: string;
  title_ta: string | null;
  description_en: string | null;
  description_ta: string | null;
  image: string | null;
  sortOrder: number;
  status: "draft" | "published";
}

export default function HistoryForm({ existing, nextSortOrder = 0 }: { existing?: Entry; nextSortOrder?: number }) {
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
      year: form.get("year"),
      title_en: form.get("title_en"),
      title_ta: form.get("title_ta") || undefined,
      description_en: form.get("description_en") || undefined,
      description_ta: form.get("description_ta") || undefined,
      image: form.get("image") || undefined,
      sortOrder: form.get("sortOrder") || 0,
    };

    const url = existing ? `/api/admin/history/${existing.id}` : "/api/admin/history";
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
      router.push(`/admin/history/${created.id}`);
    }
  }

  async function togglePublish() {
    if (!existing) return;
    const nextStatus = existing.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/history/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="admin-panel space-y-4">
        <div>
          <label htmlFor="history-year" className="admin-label">Year *</label>
          <input id="history-year" name="year" required defaultValue={existing?.year} placeholder="e.g. 1850 or 1850s" className="admin-input" />
          {errors.year?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
        </div>

        <BilingualField label="Title" nameEn="title_en" nameTa="title_ta" defaultValueEn={existing?.title_en} defaultValueTa={existing?.title_ta} error={errors.title_en} />
        <BilingualField label="Description" nameEn="description_en" nameTa="description_ta" defaultValueEn={existing?.description_en ?? ""} defaultValueTa={existing?.description_ta} required={false} multiline />

        <ImageUploadField label="Image (optional)" name="image" folder="history" defaultValue={existing?.image} />

        <div>
          <label htmlFor="history-sort-order" className="admin-label">Sort Order</label>
          <input id="history-sort-order" type="number" name="sortOrder" defaultValue={existing?.sortOrder ?? nextSortOrder} className="admin-input w-32" />
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          {submitting ? "Saving..." : existing ? "Save Changes" : "Create Entry"}
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
