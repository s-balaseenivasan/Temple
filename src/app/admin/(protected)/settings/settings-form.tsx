"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadField from "@/components/image-upload-field";

interface Settings {
  templeName_en: string;
  templeName_ta: string | null;
  addressLine_en: string;
  addressLine_ta: string | null;
  phone: string;
  email: string | null;
  mapLatitude: string | null;
  mapLongitude: string | null;
  heroImage: string | null;
}

export default function SettingsForm({ settings }: { settings: Settings }) {
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
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      templeName_en: form.get("templeName_en"),
      templeName_ta: form.get("templeName_ta") || undefined,
      addressLine_en: form.get("addressLine_en"),
      addressLine_ta: form.get("addressLine_ta") || undefined,
      phone: form.get("phone"),
      email: form.get("email") || undefined,
      mapLatitude: form.get("mapLatitude") || undefined,
      mapLongitude: form.get("mapLongitude") || undefined,
      heroImage: form.get("heroImage") || undefined,
    };

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) setErrors(body.details.fieldErrors);
      else setFormError("Save failed.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel max-w-2xl space-y-4 text-sm">
      <div>
        <label htmlFor="templeName_en" className="admin-label">Temple Name (English) *</label>
        <input id="templeName_en" name="templeName_en" required defaultValue={settings.templeName_en} className="admin-input" />
        {errors.templeName_en?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
      </div>
      <div>
        <label htmlFor="templeName_ta" className="font-tamil mb-1 block font-medium text-text-secondary">Temple Name (Tamil)</label>
        <input id="templeName_ta" name="templeName_ta" defaultValue={settings.templeName_ta ?? ""} className="font-tamil admin-input" />
      </div>
      <div>
        <label htmlFor="addressLine_en" className="admin-label">Address (English) *</label>
        <input id="addressLine_en" name="addressLine_en" required defaultValue={settings.addressLine_en} className="admin-input" />
        {errors.addressLine_en?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
      </div>
      <div>
        <label htmlFor="addressLine_ta" className="font-tamil mb-1 block font-medium text-text-secondary">Address (Tamil)</label>
        <input id="addressLine_ta" name="addressLine_ta" defaultValue={settings.addressLine_ta ?? ""} className="font-tamil admin-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phone" className="admin-label">Phone</label>
          <input id="phone" name="phone" defaultValue={settings.phone} className="admin-input" />
        </div>
        <div>
          <label htmlFor="email" className="admin-label">Email</label>
          <input id="email" name="email" type="email" defaultValue={settings.email ?? ""} className="admin-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="mapLatitude" className="admin-label">Map Latitude</label>
          <input id="mapLatitude" name="mapLatitude" type="number" step="any" defaultValue={settings.mapLatitude ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="mapLongitude" className="admin-label">Map Longitude</label>
          <input id="mapLongitude" name="mapLongitude" type="number" step="any" defaultValue={settings.mapLongitude ?? ""} className="admin-input" />
        </div>
      </div>
      <p className="text-xs text-text-secondary">Leave map coordinates blank to hide the map on the public Contact page — the address will still show as text.</p>

      <div>
        <ImageUploadField label="Homepage Hero Photo" name="heroImage" folder="site-settings" defaultValue={settings.heroImage} errors={errors.heroImage} />
        <p className="mt-1 text-xs text-text-secondary">Leave blank to keep the decorative placeholder on the homepage.</p>
      </div>

      {formError && <p className="text-error">{formError}</p>}
      {message && <p className="text-success">{message}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
