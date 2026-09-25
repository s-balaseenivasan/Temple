"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/donation-copy";
import type { Locale } from "@/lib/i18n";

interface Purpose {
  id: string;
  name_en: string;
  name_ta: string | null;
}

export default function DonationForm({
  purposes,
  locale,
  initialAmount,
}: {
  purposes: Purpose[];
  locale: Locale;
  initialAmount?: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const langClass = locale === "ta" ? "font-tamil" : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return; // RULE-019: prevent double-submit
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      donorName: form.get("donorName"),
      mobile: form.get("mobile"),
      email: form.get("email") || undefined,
      address: form.get("address") || undefined,
      pan: form.get("pan") ? String(form.get("pan")).toUpperCase() : undefined,
      amount: form.get("amount"),
      purposeId: form.get("purposeId"),
      anonymous: form.get("anonymous") === "on",
    };

    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body?.details?.fieldErrors) {
        setErrors(body.details.fieldErrors);
      } else {
        setFormError(t("genericError", locale));
      }
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    const checkoutUrl = data.clientConfig?.checkoutUrl as string | undefined;
    if (checkoutUrl) {
      router.push(checkoutUrl);
    } else {
      router.push(`/donate/${data.donationId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${langClass}`} noValidate>
      <Field label={t("donorNameLabel", locale)} name="donorName" required errors={errors.donorName} />
      <Field label={t("mobileLabel", locale)} name="mobile" type="tel" required errors={errors.mobile} />
      <Field label={t("emailLabel", locale)} name="email" type="email" errors={errors.email} />
      <Field label={t("addressLabel", locale)} name="address" errors={errors.address} />
      <Field label={t("panLabel", locale)} name="pan" errors={errors.pan} />

      <div>
        <label htmlFor="purposeId" className="form-label">
          {t("purposeLabel", locale)}
        </label>
        <select id="purposeId" name="purposeId" required className="form-input">
          {purposes.map((p) => (
            <option key={p.id} value={p.id}>
              {locale === "ta" && p.name_ta ? p.name_ta : p.name_en}
            </option>
          ))}
        </select>
      </div>

      <Field
        label={t("amountLabel", locale)}
        name="amount"
        type="number"
        required
        errors={errors.amount}
        min={10}
        defaultValue={initialAmount}
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm text-text-primary">
        <input type="checkbox" name="anonymous" className="h-4 w-4 accent-[var(--primary)]" />
        {t("anonymousLabel", locale)}
      </label>

      {formError && (
        <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary h-12 w-full"
      >
        {submitting ? t("submittingButton", locale) : t("submitButton", locale)}
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
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  errors?: string[];
  min?: number;
  defaultValue?: number;
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
        min={min}
        defaultValue={defaultValue}
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
