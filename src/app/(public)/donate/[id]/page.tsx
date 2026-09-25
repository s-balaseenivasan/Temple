"use client";

import { use, useEffect, useState } from "react";
import { t } from "@/lib/donation-copy";
import type { Locale } from "@/lib/i18n";

interface DonationStatus {
  id: string;
  status: "pending" | "success" | "failed" | "refunded";
  amount: string;
  donationType: string;
  receipt: { id: string; receiptNumber: string } | null;
}

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "ta";
  const match = document.cookie.match(/(?:^|; )lang=(en|ta)/);
  return match ? (match[1] as Locale) : "ta";
}

// FEAT-041/042: RULE-012 hard requirement — this page NEVER reads the ?outcome=
// query string from a gateway redirect to decide success/failure. It only ever
// shows "Verifying..." until the server (via the webhook-driven state change)
// reports a terminal status through GET /api/donations/:id.
export default function DonationStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DonationStatus | null>(null);
  const [error, setError] = useState(false);
  const [locale, setLocale] = useState<Locale>("ta");

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/donations/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not found");
        const json = (await res.json()) as DonationStatus;
        if (cancelled) return;
        setData(json);
        if (json.status === "pending" && attempts < 40) {
          setTimeout(poll, 1500);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const langClass = locale === "ta" ? "font-tamil" : "";

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center py-16">
      <div className={`panel relative w-full max-w-md overflow-hidden px-8 pb-10 pt-12 text-center ${langClass}`}>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" aria-hidden="true" />
        {error && <p className="text-error">{locale === "ta" ? "நன்கொடை நிலையை ஏற்ற முடியவில்லை." : "Could not load donation status."}</p>}

        {!error && !data && <p className="text-text-secondary">{locale === "ta" ? "ஏற்றுகிறது..." : "Loading..."}</p>}

        {data?.status === "pending" && (
          <>
            <span aria-hidden="true" className="mx-auto mb-6 block h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="mb-2 font-display text-2xl font-semibold text-text-primary">{t("verifying", locale)}</p>
            <p className="text-sm text-text-secondary">{t("processingNote", locale)}</p>
          </>
        )}

        {data?.status === "success" && (
          <>
            <span aria-hidden="true" className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl">🙏</span>
            <p className="mb-2 font-display text-3xl font-semibold text-success">{t("thankYou", locale)}</p>
            <p className="mb-6 text-sm text-text-secondary">
              {t("amountLabelShort", locale)}: <span className="font-display text-lg font-semibold text-text-primary">₹{data.amount}</span>
            </p>
            {data.receipt && (
              <>
                <p className="mb-6 border-y border-border py-3 text-sm text-text-secondary">
                  {t("receiptNoLabel", locale)}: <span className="font-semibold tabular-nums text-text-primary">{data.receipt.receiptNumber}</span>
                </p>
                <a
                  href={`/api/receipts/${data.receipt.id}/pdf`}
                  className="btn btn-primary"
                >
                  {t("downloadReceipt", locale)}
                </a>
              </>
            )}
          </>
        )}

        {data?.status === "failed" && (
          <>
            <p className="mb-2 font-display text-2xl font-semibold text-error">{t("paymentFailed", locale)}</p>
            <p className="mb-6 text-sm text-text-secondary">{t("paymentFailedNote", locale)}</p>
            <a href="/donate" className="btn btn-primary">
              {t("tryAgain", locale)}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
