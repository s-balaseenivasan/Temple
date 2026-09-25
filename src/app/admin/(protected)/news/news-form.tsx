"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface NewsItem {
  id: string;
  title_en: string;
  title_ta: string | null;
  body_en: string;
  body_ta: string | null;
  featuredImage: string | null;
  category: string | null;
  status: "draft" | "published" | "archived";
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["published"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export default function NewsForm({ existing }: { existing?: NewsItem }) {
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
      body_en: form.get("body_en"),
      body_ta: form.get("body_ta") || undefined,
      featuredImage: form.get("featuredImage") || undefined,
      category: form.get("category") || undefined,
    };

    const url = existing ? `/api/admin/news/${existing.id}` : "/api/admin/news";
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
      router.push(`/admin/news/${created.id}`);
    }
  }

  async function changeStatus(status: string) {
    if (!existing) return;
    setFormError(null);
    const res = await fetch(`/api/admin/news/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.detail ?? "Status change failed.");
      return;
    }
    router.refresh();
  }

  const allowedNext = existing ? ALLOWED_TRANSITIONS[existing.status] ?? [] : [];

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="admin-panel space-y-4">
        <BilingualField label="Title" nameEn="title_en" nameTa="title_ta" defaultValueEn={existing?.title_en} defaultValueTa={existing?.title_ta} error={errors.title_en} />
        <BilingualField label="Body" nameEn="body_en" nameTa="body_ta" defaultValueEn={existing?.body_en} defaultValueTa={existing?.body_ta} multiline error={errors.body_en} />
        <ImageUploadField label="Featured Image (optional)" name="featuredImage" folder="news" defaultValue={existing?.featuredImage} />
        <div>
          <label htmlFor="news-category" className="admin-label">Category (optional)</label>
          <input id="news-category" name="category" defaultValue={existing?.category ?? ""} className="admin-input" />
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
          <div className="flex gap-2">
            {allowedNext.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                className="btn btn-outline btn-xs"
              >
                Move to &quot;{s}&quot;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
