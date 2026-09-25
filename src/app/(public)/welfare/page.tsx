import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-078 / CONFIRMED scope boundary: informational only — no online
// application/approval workflow. A member wanting help contacts the
// committee directly (Contact form or in person).
export default async function WelfarePage() {
  const [programs, locale] = await Promise.all([
    prisma.welfareProgram.findMany({ where: { status: "active" }, orderBy: { sortOrder: "asc" } }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "சமூக சேவை" : "Service"}
        title={locale === "ta" ? "நலப்பணிகள்" : "Welfare Works"}
        subtitle={
          locale === "ta"
            ? "உதவி தேவைப்படுபவர்கள் நிர்வாக அலுவலகத்தை நேரடியாகவோ அல்லது தொடர்பு படிவம் மூலமாகவோ தொடர்பு கொள்ளலாம்."
            : "Members seeking help may contact the temple office directly or through the Contact form."
        }
        locale={locale}
      />
      <div className="page-container max-w-5xl py-12 sm:py-16">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {programs.map((p, i) => (
            <div key={p.id} className="flex flex-col gap-3 bg-background p-6 sm:p-8">
              <span className="font-display text-sm font-semibold tabular-nums text-secondary">{String(i + 1).padStart(2, "0")}</span>
              <h2 className={`text-xl font-semibold text-text-primary sm:text-2xl ${headingClass}`}>{pick(p.name_en, p.name_ta, locale)}</h2>
              {(p.description_en || p.description_ta) && (
                <p className={`leading-relaxed text-text-secondary ${langClass}`}>{pick(p.description_en ?? "", p.description_ta, locale)}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/contact" className={`btn btn-primary ${langClass}`}>
            {locale === "ta" ? "அலுவலகத்தைத் தொடர்பு கொள்ள" : "Contact the temple office"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
