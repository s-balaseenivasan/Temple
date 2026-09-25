"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface VideoItem {
  id: string;
  title_en: string;
  title_ta: string | null;
  videoUrl: string;
  thumbnail: string | null;
  description_en: string | null;
  description_ta: string | null;
  category: string | null;
  status: "draft" | "published" | "archived";
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["published"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export default function VideoForm({ existing }: { existing?: VideoItem }) {
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
      videoUrl: form.get("videoUrl"),
      thumbnail: form.get("thumbnail") || undefined,
      description_en: form.get("description_en") || undefined,
      description_ta: form.get("description_ta") || undefined,
      category: form.get("category") || undefined,
    };

    const url = existing ? `/api/admin/videos/${existing.id}` : "/api/admin/videos";
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
      router.push(`/admin/videos/${created.id}`);
    }
  }

  async function changeStatus(status: string) {
    if (!existing) return;
    setFormError(null);
    const res = await fetch(`/api/admin/videos/${existing.id}`, {
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
        <div>
          <label htmlFor="video-url" className="admin-label">YouTube URL *</label>
          <input id="video-url" name="videoUrl" required defaultValue={existing?.videoUrl} placeholder="https://www.youtube.com/watch?v=..." className="admin-input" />
          {errors.videoUrl?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
        </div>
        <ImageUploadField label="Thumbnail (optional)" name="thumbnail" folder="videos" defaultValue={existing?.thumbnail} />
        <BilingualField label="Description" nameEn="description_en" nameTa="description_ta" defaultValueEn={existing?.description_en ?? ""} defaultValueTa={existing?.description_ta} required={false} multiline />
        <div>
          <label htmlFor="video-category" className="admin-label">Category</label>
          <input id="video-category" name="category" defaultValue={existing?.category ?? ""} className="admin-input" />
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
              <button key={s} onClick={() => changeStatus(s)} className="btn btn-outline btn-xs">
                Move to &quot;{s}&quot;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
