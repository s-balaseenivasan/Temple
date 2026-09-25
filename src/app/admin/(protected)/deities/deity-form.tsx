"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface Deity {
  id: string;
  name_en: string;
  name_ta: string | null;
  description_en: string | null;
  description_ta: string | null;
  image: string | null;
  sortOrder: number;
  status: "active" | "inactive";
}

export default function DeityForm({ existing, nextSortOrder = 0 }: { existing?: Deity; nextSortOrder?: number }) {
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
      name_en: form.get("name_en"),
      name_ta: form.get("name_ta") || undefined,
      description_en: form.get("description_en") || undefined,
      description_ta: form.get("description_ta") || undefined,
      image: form.get("image") || undefined,
      sortOrder: form.get("sortOrder") || 0,
    };

    const url = existing ? `/api/admin/deities/${existing.id}` : "/api/admin/deities";
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
      router.push(`/admin/deities/${created.id}`);
    }
  }

  async function toggleStatus() {
    if (!existing) return;
    const nextStatus = existing.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/deities/${existing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="admin-panel space-y-4">
        <BilingualField label="Name" nameEn="name_en" nameTa="name_ta" defaultValueEn={existing?.name_en} defaultValueTa={existing?.name_ta} error={errors.name_en} />

        <ImageUploadField label="Photo" name="image" folder="deities" defaultValue={existing?.image} errors={errors.image} />

        <BilingualField
          label="Description"
          nameEn="description_en"
          nameTa="description_ta"
          defaultValueEn={existing?.description_en ?? ""}
          defaultValueTa={existing?.description_ta}
          required={false}
          multiline
        />

        <div>
          <label htmlFor="deity-sort-order" className="admin-label">
            Display Order
          </label>
          <input
            id="deity-sort-order"
            type="number"
            name="sortOrder"
            defaultValue={existing?.sortOrder ?? nextSortOrder}
            className="admin-input w-32"
          />
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          {submitting ? "Saving..." : existing ? "Save Changes" : "Create Deity"}
        </button>
        {message && <span className="ml-3 text-sm text-success">{message}</span>}
      </form>

      {existing && (
        <div className="admin-panel text-sm">
          <p className="mb-2">
            Current status: <span className="font-medium">{existing.status}</span>
          </p>
          <button onClick={toggleStatus} className="btn btn-outline btn-xs">
            {existing.status === "active" ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      )}
    </div>
  );
}
