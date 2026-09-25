"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BilingualField } from "@/components/bilingual-field";
import ImageUploadField from "@/components/image-upload-field";

interface Member {
  id: string;
  photo: string | null;
  name_en: string;
  name_ta: string | null;
  designationId: string;
  mobile: string;
  publicMobileVisible: boolean;
  email: string | null;
  bio_en: string | null;
  bio_ta: string | null;
  displayOrder: number;
  status: "active" | "inactive";
}

export default function MemberForm({
  existing,
  designations,
  nextDisplayOrder = 0,
}: {
  existing?: Member;
  designations: { id: string; name_en: string }[];
  // Only used for the create form — otherwise every new member ties at the
  // schema default of 0, which made the reorder Up/Down buttons (FEAT-032)
  // do nothing until an admin manually typed a distinct value for each one.
  nextDisplayOrder?: number;
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
      photo: form.get("photo") || undefined,
      name_en: form.get("name_en"),
      name_ta: form.get("name_ta") || undefined,
      designationId: form.get("designationId"),
      mobile: form.get("mobile"),
      publicMobileVisible: form.get("publicMobileVisible") === "on",
      email: form.get("email") || undefined,
      bio_en: form.get("bio_en") || undefined,
      bio_ta: form.get("bio_ta") || undefined,
      displayOrder: form.get("displayOrder") || 0,
    };

    const url = existing ? `/api/admin/committee/${existing.id}` : "/api/admin/committee";
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
      router.push(`/admin/committee/${created.id}`);
    }
  }

  async function toggleStatus() {
    if (!existing) return;
    const nextStatus = existing.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/committee/${existing.id}`, {
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="member-designation" className="admin-label">Designation *</label>
            <select id="member-designation" name="designationId" required defaultValue={existing?.designationId} className="admin-input">
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="member-display-order" className="admin-label">Display Order</label>
            <input id="member-display-order" type="number" name="displayOrder" defaultValue={existing?.displayOrder ?? nextDisplayOrder} className="admin-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="member-mobile" className="admin-label">Mobile *</label>
            <input id="member-mobile" name="mobile" required defaultValue={existing?.mobile} className="admin-input" />
            {errors.mobile?.map((e) => <p key={e} className="mt-1 text-xs text-error">{e}</p>)}
          </div>
          <div>
            <label htmlFor="member-email" className="admin-label">Email</label>
            <input id="member-email" name="email" type="email" defaultValue={existing?.email ?? ""} className="admin-input" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="publicMobileVisible" defaultChecked={existing?.publicMobileVisible} className="h-4 w-4" />
          Show mobile number on the public committee page
        </label>

        <ImageUploadField label="Photo" name="photo" folder="committee" defaultValue={existing?.photo} />

        <BilingualField label="Bio" nameEn="bio_en" nameTa="bio_ta" defaultValueEn={existing?.bio_en ?? ""} defaultValueTa={existing?.bio_ta} required={false} multiline />

        {formError && <p className="text-sm text-error">{formError}</p>}
        <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
          {submitting ? "Saving..." : existing ? "Save Changes" : "Create Member"}
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
