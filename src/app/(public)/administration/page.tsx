import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-079: structural description + link to the existing named committee
// directory — both are kept, per the stakeholder's explicit decision
// (_CONTEXT_BRIEF.md §11.3).
export default async function AdministrationPage() {
  const [settings, members, locale] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.committeeMember.findMany({ where: { status: "active" }, orderBy: { displayOrder: "asc" }, include: { designation: true } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <>
      <PageHeader kicker={locale === "ta" ? "நிர்வாக அமைப்பு" : "Governance"} title={locale === "ta" ? "நிர்வாகம்" : "Administration"} locale={locale} />
      <div className="page-container max-w-4xl py-12 sm:py-16">
        <p className={`text-pretty text-xl leading-relaxed text-text-primary ${langClass}`}>
          {settings ? pick(settings.adminStructureNote_en, settings.adminStructureNote_ta, locale) : ""}
        </p>

        <div className="mt-16 flex items-end justify-between gap-4 border-b border-border pb-4">
          <h2 className={`text-2xl font-semibold text-text-primary sm:text-3xl ${headingClass}`}>
            {locale === "ta" ? "செயற்குழு உறுப்பினர்கள்" : "Committee Members"}
          </h2>
          <Link href="/committee" className={`link-arrow hidden shrink-0 sm:inline-flex ${langClass}`}>
            {locale === "ta" ? "அனைவரையும் காண்க" : "View all"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <dl className="grid sm:grid-cols-2">
          {members.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-baseline justify-between gap-4 border-b border-border py-4 sm:odd:pr-6 sm:even:pl-6">
              <dt className={`font-medium text-text-primary ${langClass}`}>{pick(m.name_en, m.name_ta, locale)}</dt>
              <dd className={`text-right text-sm text-secondary ${langClass}`}>{pick(m.designation.name_en, m.designation.name_ta, locale)}</dd>
            </div>
          ))}
        </dl>
        <Link href="/committee" className={`link-arrow mt-6 ${langClass}`}>
          {locale === "ta" ? "அனைத்து செயற்குழு உறுப்பினர்களையும் காண்க" : "View all committee members"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>

        {settings?.transparencyNote_en && (
          <div className="mt-16 rounded-2xl border border-border bg-surface p-6 sm:p-10">
            <p className={`kicker ${langClass}`}>{locale === "ta" ? "வெளிப்படைத்தன்மை" : "Accountability"}</p>
            <h2 className={`mt-2 text-2xl font-semibold text-text-primary ${headingClass}`}>
              {locale === "ta" ? "நிர்வாக வெளிப்படைத்தன்மை" : "Transparency"}
            </h2>
            <p className={`mt-4 leading-relaxed text-text-secondary ${langClass}`}>{pick(settings.transparencyNote_en, settings.transparencyNote_ta, locale)}</p>
            <Link href="/documents" className={`btn btn-outline mt-6 ${langClass}`}>
              <FileText aria-hidden="true" className="h-4 w-4" />
              {locale === "ta" ? "ஆவணங்களைக் காண்க" : "View published documents"}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
