"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const REQUEST_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  registration: { en: "New Registration", ta: "புதிய பதிவு" },
  family_update: { en: "Family Details Update", ta: "குடும்ப விவரங்கள் புதுப்பித்தல்" },
  contact_update: { en: "Contact Details Update", ta: "தொடர்பு விவரங்கள் புதுப்பித்தல்" },
  matrimony_update: { en: "Matrimony (மகமை) Details Update", ta: "மகமை விவரங்கள் புதுப்பித்தல்" },
};

export default function MemberRequestForm({ locale }: { locale: Locale }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const langClass = locale === "ta" ? "font-tamil" : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      requestType: form.get("requestType"),
      pangaliName: form.get("pangaliName"),
      familyRepresentativeName: form.get("familyRepresentativeName"),
      mobile: form.get("mobile"),
      email: form.get("email") || undefined,
      lineageBranch: form.get("lineageBranch") || undefined,
      details: form.get("details"),
    };

    const res = await fetch("/api/member-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) setErrors(body.details.fieldErrors);
      else setFormError(locale === "ta" ? "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்." : "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-success/30 bg-success/5 p-6 text-success ${langClass}`}>
        {locale === "ta"
          ? "உங்கள் கோரிக்கை பெறப்பட்டது. நிர்வாக அலுவலகம் விரைவில் உங்களைத் தொடர்பு கொள்ளும்."
          : "Your request has been received. The temple office will contact you shortly."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${langClass}`} noValidate>
      <div>
        <label htmlFor="requestType" className="form-label">{locale === "ta" ? "கோரிக்கை வகை" : "Request Type"}</label>
        <select id="requestType" name="requestType" required className="form-input">
          {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {locale === "ta" ? label.ta : label.en}
            </option>
          ))}
        </select>
      </div>

      <Field label={locale === "ta" ? "பங்காளி பெயர்" : "Pangali Name"} name="pangaliName" required errors={errors.pangaliName} />
      <Field
        label={locale === "ta" ? "குடும்ப பிரதிநிதி பெயர்" : "Family Representative Name"}
        name="familyRepresentativeName"
        required
        errors={errors.familyRepresentativeName}
      />
      <Field label={locale === "ta" ? "கைபேசி எண்" : "Mobile Number"} name="mobile" type="tel" required errors={errors.mobile} />
      <Field label={locale === "ta" ? "மின்னஞ்சல் (விருப்பம்)" : "Email (optional)"} name="email" type="email" errors={errors.email} />
      <Field label={locale === "ta" ? "கொத்து / கிளை (விருப்பம்)" : "Lineage Branch (optional)"} name="lineageBranch" errors={errors.lineageBranch} />

      <div>
        <label htmlFor="details" className="form-label">{locale === "ta" ? "விவரங்கள்" : "Details"}</label>
        <textarea id="details" name="details" required rows={4} className="form-input" />
        {errors.details?.map((e) => (
          <p key={e} className="form-error">
            {e}
          </p>
        ))}
      </div>

      {formError && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary h-12 w-full"
      >
        {submitting ? (locale === "ta" ? "சமர்ப்பிக்கிறது..." : "Submitting...") : locale === "ta" ? "சமர்ப்பிக்கவும்" : "Submit Request"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="form-input"
      />
      {errors?.map((e) => (
        <p key={e} className="form-error">
          {e}
        </p>
      ))}
    </div>
  );
}
