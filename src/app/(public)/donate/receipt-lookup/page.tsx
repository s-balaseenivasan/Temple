"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/donation-copy";
import type { Locale } from "@/lib/i18n";

interface LookupResult {
  receiptId: string;
  receiptNumber: string;
  amount: string;
  issuedAt: string;
}

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "ta";
  const match = document.cookie.match(/(?:^|; )lang=(en|ta)/);
  return match ? (match[1] as Locale) : "ta";
}

export default function ReceiptLookupPage() {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locale, setLocale] = useState<Locale>("ta");

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/receipts/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mobile: form.get("mobile"),
        receiptNumber: form.get("receiptNumber"),
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(t("lookupNotFound", locale));
      return;
    }
    setResult(await res.json());
  }

  const langClass = locale === "ta" ? "font-tamil" : "";

  return (
    <div className={`page-container max-w-md py-16 sm:py-24 ${langClass}`}>
      <div>
        <p className="kicker text-center">{locale === "ta" ? "நன்கொடை" : "Donations"}</p>
        <h1 className={`mb-8 mt-3 text-center text-4xl font-semibold tracking-tight text-text-primary ${locale === "ta" ? "font-tamil" : "font-display"}`}>{t("lookupTitle", locale)}</h1>
        <form onSubmit={handleSubmit} className="panel space-y-5 p-6 sm:p-8" noValidate>
          <div>
            <label htmlFor="lookup-mobile" className="form-label">{t("lookupMobileLabel", locale)}</label>
            <input id="lookup-mobile" name="mobile" required className="form-input" />
          </div>
          <div>
            <label htmlFor="lookup-receipt" className="form-label">{t("lookupReceiptNoLabel", locale)}</label>
            <input
              id="lookup-receipt"
              name="receiptNumber"
              required
              placeholder="DON-2026-000001"
              className="form-input"
            />
          </div>
          {error && <p role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary h-12 w-full"
          >
            {submitting ? t("lookupSearching", locale) : t("lookupButton", locale)}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6 text-sm">
            <p>
              {t("receiptNoLabel", locale)}: {result.receiptNumber}
            </p>
            <p>
              {t("amountLabelShort", locale)}: ₹{result.amount}
            </p>
            <a href={`/api/receipts/${result.receiptId}/pdf`} className="link-arrow mt-3">
              {t("downloadReceipt", locale)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
