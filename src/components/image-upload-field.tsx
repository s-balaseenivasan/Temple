"use client";

import { useId, useState } from "react";

// Folder must match one of the ALLOWED_FOLDERS in /api/admin/uploads.
export type UploadFolder = "deities" | "site-settings" | "committee" | "news" | "events" | "gallery" | "history" | "videos";

// Replaces the old plain "paste a URL" text field with a real file picker
// that uploads straight to Cloudinary — the URL field is kept alongside it
// (not removed) so an admin can still link an already-hosted image instead.
export default function ImageUploadField({
  label,
  name,
  folder,
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  folder: UploadFolder;
  defaultValue?: string | null;
  errors?: string[];
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      setUploadError("Upload failed — check the file is a JPG, PNG, WEBP, or GIF under 5MB.");
      return;
    }
    const body = await res.json();
    setValue(body.url);
  }

  return (
    <div>
      <label htmlFor={inputId} className="admin-label">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 rounded object-cover" />
        )}
        <input
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Image URL, or upload a file →"
          className="admin-input w-auto min-w-[180px] flex-1"
        />
        <label className="btn btn-outline btn-xs cursor-pointer">
          {uploading ? "Uploading..." : "Upload"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      </div>
      {uploadError && <p className="mt-1 text-xs text-error">{uploadError}</p>}
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-error">
          {e}
        </p>
      ))}
    </div>
  );
}
