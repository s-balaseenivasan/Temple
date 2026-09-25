"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface Album {
  id: string;
  title_en: string;
  title_ta: string | null;
  category: string | null;
  coverImage: string | null;
  date: string | null;
  description_en: string | null;
  description_ta: string | null;
}

export default function AlbumForm({ existing }: { existing?: Album }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
      category: form.get("category") || undefined,
      coverImage: form.get("coverImage") || undefined,
      date: form.get("date") || undefined,
      description_en: form.get("description_en") || undefined,
      description_ta: form.get("description_ta") || undefined,
    };

    const url = existing ? `/api/admin/gallery/albums/${existing.id}` : "/api/admin/gallery/albums";
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
      router.refresh();
    } else {
      const created = await res.json();
      router.push(`/admin/gallery/${created.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel space-y-4">
      <BilingualField label="Title" nameEn="title_en" nameTa="title_ta" defaultValueEn={existing?.title_en} defaultValueTa={existing?.title_ta} error={errors.title_en} />
      <BilingualField
        label="Description"
        nameEn="description_en"
        nameTa="description_ta"
        defaultValueEn={existing?.description_en ?? ""}
        defaultValueTa={existing?.description_ta}
        required={false}
        multiline
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="album-category" className="admin-label">Category</label>
          <input id="album-category" name="category" defaultValue={existing?.category ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="album-date" className="admin-label">Date</label>
          <input id="album-date" type="date" name="date" defaultValue={existing?.date?.slice(0, 10)} className="admin-input" />
        </div>
      </div>
      <ImageUploadField label="Cover Image" name="coverImage" folder="gallery" defaultValue={existing?.coverImage} />
      {formError && <p className="text-sm text-error">{formError}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : existing ? "Save Changes" : "Create Album"}
      </button>
    </form>
  );
}
