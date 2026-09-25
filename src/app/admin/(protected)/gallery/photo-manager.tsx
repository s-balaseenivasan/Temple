"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/image-upload-field";

interface Photo {
  id: string;
  imageUrl: string;
  caption_en: string | null;
  sortOrder: number;
}

export default function PhotoManager({ albumId, photos }: { albumId: string; photos: Photo[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Bumped after each successful add to remount the form below, clearing
  // ImageUploadField's internal state — a native form.reset() wouldn't touch
  // that state since the field is React-controlled, not DOM-controlled.
  const [formKey, setFormKey] = useState(0);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/gallery/photos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        albumId,
        imageUrl: form.get("imageUrl"),
        caption_en: form.get("caption_en") || undefined,
        sortOrder: photos.length,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not add photo — check the image URL.");
      return;
    }
    setFormKey((k) => k + 1);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/gallery/photos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    const swapWith = photos[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/gallery/photos/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
      }),
      fetch(`/api/admin/gallery/photos/${swapWith.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder: photos[idx].sortOrder }),
      }),
    ]);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form key={formKey} onSubmit={handleAdd} className="admin-panel flex flex-wrap items-end gap-2 text-sm">
        <div className="min-w-[240px] flex-1">
          <ImageUploadField label="Photo" name="imageUrl" folder="gallery" />
        </div>
        <input name="caption_en" aria-label="Caption (optional)" placeholder="Caption (optional)" className="admin-input w-auto min-w-[160px] flex-1" />
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          Add Photo
        </button>
      </form>
      {error && <p className="text-sm text-error">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p, idx) => (
            <div key={p.id} className="rounded-lg border border-border bg-surface p-2 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.caption_en ?? ""} className="mb-1 h-24 w-full rounded object-cover" />
              <p className="truncate">{p.caption_en ?? "(no caption)"}</p>
              <div className="mt-1 flex justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(p.id, -1)}
                    disabled={idx === 0}
                    aria-label={`Move photo ${idx + 1} up`}
                    className="text-text-secondary disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(p.id, 1)}
                    disabled={idx === photos.length - 1}
                    aria-label={`Move photo ${idx + 1} down`}
                    className="text-text-secondary disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <button onClick={() => remove(p.id)} className="text-error">
                  Remove
                </button>
              </div>
            </div>
          ))}
        {photos.length === 0 && <p className="col-span-full text-text-secondary">No photos in this album yet.</p>}
      </div>
    </div>
  );
}
