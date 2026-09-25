"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function ContactForm({ locale }: { locale: Locale }) {
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
      name: form.get("name"),
      mobile: form.get("mobile"),
      email: form.get("email") || undefined,
      enquirerType: form.get("enquirerType"),
      message: form.get("message"),
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) setErrors(body.details.fieldErrors);
      else if (res.status === 429) setFormError(locale === "ta" ? "பல முயற்சிகள். சிறிது நேரம் கழித்து முயற்சிக்கவும்." : "Too many attempts. Please try again later.");
      else setFormError(locale === "ta" ? "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்." : "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={`rounded-2xl border border-success/30 bg-success/5 p-6 text-success ${langClass}`}>
        {locale === "ta"
          ? "உங்கள் செய்தி பெறப்பட்டது. கோவில் அலுவலகம் விரைவில் உங்களைத் தொடர்பு கொள்ளும்."
          : "Your message has been received. The temple office will contact you shortly."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${langClass}`} noValidate>
      <div>
        <label htmlFor="contact-name" className="form-label">
          {locale === "ta" ? "பெயர்" : "Name"}
        </label>
        <input id="contact-name" name="name" required className="form-input" />
        {errors.name?.map((e) => <p key={e} className="form-error">{e}</p>)}
      </div>
      <div>
        <label htmlFor="contact-mobile" className="form-label">
          {locale === "ta" ? "கைபேசி எண்" : "Mobile Number"}
        </label>
        <input id="contact-mobile" name="mobile" type="tel" required className="form-input" />
        {errors.mobile?.map((e) => <p key={e} className="form-error">{e}</p>)}
      </div>
      <div>
        <label htmlFor="contact-email" className="form-label">
          {locale === "ta" ? "மின்னஞ்சல் (விருப்பம்)" : "Email (optional)"}
        </label>
        <input id="contact-email" name="email" type="email" className="form-input" />
        {errors.email?.map((e) => <p key={e} className="form-error">{e}</p>)}
      </div>

      <fieldset>
        <legend className="form-label">
          {locale === "ta" ? "நீங்கள் யார்?" : "You are a"}
        </legend>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
            <input type="radio" name="enquirerType" value="pangali" required className="accent-[var(--primary)]" /> {locale === "ta" ? "பங்காளி" : "Pangali"}
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
            <input type="radio" name="enquirerType" value="bhaktar" required className="accent-[var(--primary)]" /> {locale === "ta" ? "பக்தர்" : "Bhaktar"}
          </label>
        </div>
        {errors.enquirerType?.map((e) => <p key={e} className="form-error">{e}</p>)}
      </fieldset>

      <div>
        <label htmlFor="contact-message" className="form-label">
          {locale === "ta" ? "செய்தி" : "Message"}
        </label>
        <textarea id="contact-message" name="message" required rows={4} className="form-input" />
        {errors.message?.map((e) => <p key={e} className="form-error">{e}</p>)}
      </div>

      {formError && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary h-12 w-full"
      >
        {submitting ? (locale === "ta" ? "அனுப்புகிறது..." : "Sending...") : locale === "ta" ? "செய்தியை அனுப்பவும்" : "Send Message"}
      </button>
    </form>
  );
}
