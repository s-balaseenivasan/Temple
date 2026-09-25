import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { t } from "@/lib/donation-copy";
import Link from "next/link";
import { FileCheck2, Landmark, ShieldCheck } from "lucide-react";
import DonationForm from "./donation-form";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function DonatePage({ searchParams }: { searchParams: Promise<{ amount?: string }> }) {
  const [{ amount }, purposes, locale] = await Promise.all([
    searchParams,
    prisma.donationPurpose.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    getLocale(),
  ]);
  const ta = locale === "ta";
  const langClass = ta ? "font-tamil" : "";
  // From the floating-donate quick-amount modal, if used — a plain numeric
  // prefill only, still fully editable, still validated server-side exactly
  // like every other amount this form has ever accepted.
  const initialAmount = amount && /^\d+$/.test(amount) ? Number(amount) : undefined;

  const assurances = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: ta ? "பாதுகாப்பான கட்டணம்" : "Secure payment",
      body: ta ? "கட்டணம் அங்கீகரிக்கப்பட்ட கட்டண நுழைவாயில் மூலம் செயலாக்கப்படுகிறது." : "Payments are processed by an approved payment gateway.",
    },
    {
      icon: <FileCheck2 className="h-5 w-5" />,
      title: ta ? "உடனடி ரசீது" : "Instant receipt",
      body: ta ? "வெற்றிகரமான ஒவ்வொரு நன்கொடைக்கும் PDF ரசீது வழங்கப்படும்." : "Every successful donation receives a downloadable PDF receipt.",
    },
    {
      icon: <Landmark className="h-5 w-5" />,
      title: ta ? "கோவில் பணிகளுக்கு" : "For the temple's work",
      body: ta ? "பராமரிப்பு, பூஜைகள் மற்றும் நலப்பணிகளுக்கு பயன்படுத்தப்படுகிறது." : "Used for upkeep, poojas and community welfare works.",
    },
  ];

  return (
    <>
      <PageHeader
        kicker={ta ? "காணிக்கை" : "Offering"}
        title={t("formTitle", locale).replace(/^🙏\s*/, "")}
        subtitle={pick("Sri Gurusamy Sri Ananthammal Temple, Thirumangalam", "ஸ்ரீ குருசாமி – ஸ்ரீ அனந்தம்மாள் கோவில், திருமங்கலம்", locale)}
        locale={locale}
      />
      <div className="page-container grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="panel p-6 sm:p-10">
          <DonationForm
            purposes={purposes.map((p) => ({ id: p.id, name_en: p.name_en, name_ta: p.name_ta }))}
            locale={locale}
            initialAmount={initialAmount}
          />
        </div>

        <aside className="lg:pt-4">
          <ul className="border-t border-border">
            {assurances.map((a) => (
              <li key={a.title} className="flex items-start gap-4 border-b border-border py-6">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 text-primary">
                  {a.icon}
                </span>
                <div>
                  <p className={`font-semibold text-text-primary ${langClass}`}>{a.title}</p>
                  <p className={`mt-1 text-sm text-text-secondary ${langClass}`}>{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-8 text-sm text-text-secondary ${langClass}`}>
            <Link href="/donate/receipt-lookup" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-dark">
              {t("lookupLink", locale)}
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
