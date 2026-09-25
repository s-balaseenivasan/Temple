"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface EventItem {
  id: string;
  name_en: string;
  name_ta: string | null;
  description_en: string | null;
  description_ta: string | null;
  posterImage: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  categoryId: string;
  location_en: string | null;
  location_ta: string | null;
  contactPersonName: string | null;
  contactNumber: string | null;
  registrationRequired: boolean;
  status: "draft" | "published" | "archived" | "cancelled";
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["published", "cancelled"],
  published: ["draft", "archived", "cancelled"],
  archived: ["draft"],
  cancelled: ["draft"],
};

export default function EventForm({
  existing,
  categories,
}: {
  existing?: EventItem;
  categories: { id: string; name_en: string }[];
}) {
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
      posterImage: form.get("posterImage") || undefined,
      eventDate: form.get("eventDate"),
      startTime: form.get("startTime") || undefined,
      endTime: form.get("endTime") || undefined,
      categoryId: form.get("categoryId"),
      location_en: form.get("location_en") || undefined,
      location_ta: form.get("location_ta") || undefined,
      contactPersonName: form.get("contactPersonName") || undefined,
      contactNumber: form.get("contactNumber") || undefined,
      registrationRequired: form.get("registrationRequired") === "on",
    };

    const url = existing ? `/api/admin/events/${existing.id}` : "/api/admin/events";
    const method = existing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) setErrors(body.details.fieldErrors);
      else setFormError(body.detail ?? "Save failed.");
      return;
    }

    if (existing) {
      setMessage("Saved.");
      router.refresh();
    } else {
      const created = await res.json();
      router.push(`/admin/events/${created.id}`);
    }
  }

  async function changeStatus(status: string) {
    if (!existing) return;
    setFormError(null);
    const res = await fetch(`/api/admin/events/${existing.id}`, {
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
        <BilingualField label="Name" nameEn="name_en" nameTa="name_ta" defaultValueEn={existing?.name_en} defaultValueTa={existing?.name_ta} error={errors.name_en} />
        <BilingualField label="Description" nameEn="description_en" nameTa="description_ta" defaultValueEn={existing?.description_en ?? ""} defaultValueTa={existing?.description_ta} required={false} multiline />

        <ImageUploadField label="Poster Image (optional)" name="posterImage" folder="events" defaultValue={existing?.posterImage} />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="event-date" className="admin-label">Event Date *</label>
            <input id="event-date" type="date" name="eventDate" required defaultValue={existing?.eventDate?.slice(0, 10)} className="admin-input" />
            {errors.eventDate?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
          </div>
          <div>
            <label htmlFor="event-start-time" className="admin-label">Start Time</label>
            <input id="event-start-time" type="time" name="startTime" defaultValue={existing?.startTime ?? ""} className="admin-input" />
          </div>
          <div>
            <label htmlFor="event-end-time" className="admin-label">End Time</label>
            <input id="event-end-time" type="time" name="endTime" defaultValue={existing?.endTime ?? ""} className="admin-input" />
            {errors.endTime?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
          </div>
        </div>

        <div>
          <label htmlFor="event-category" className="admin-label">Category *</label>
          <select id="event-category" name="categoryId" required defaultValue={existing?.categoryId} className="admin-input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>

        <BilingualField label="Location" nameEn="location_en" nameTa="location_ta" defaultValueEn={existing?.location_en ?? ""} defaultValueTa={existing?.location_ta} required={false} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="event-contact-name" className="admin-label">Contact Person</label>
            <input id="event-contact-name" name="contactPersonName" defaultValue={existing?.contactPersonName ?? ""} className="admin-input" />
          </div>
          <div>
            <label htmlFor="event-contact-number" className="admin-label">Contact Number</label>
            <input id="event-contact-number" name="contactNumber" defaultValue={existing?.contactNumber ?? ""} className="admin-input" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="registrationRequired" defaultChecked={existing?.registrationRequired} className="h-4 w-4" />
          Registration required (informational note only — no booking flow, per scope)
        </label>

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
