import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { Download, FileText } from "lucide-react";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, { en: string; ta: string }> = {
  registration_info: { en: "Registration Info", ta: "பதிவு தொடர்பான தகவல்கள்" },
  bylaws: { en: "Bylaws", ta: "அங்கீகரிக்கப்பட்ட நிர்வாக விதிகள்" },
  agm_report: { en: "AGM Report", ta: "பொதுக்குழு அங்கீகரித்த அறிக்கைகள்" },
  annual_activity_report: { en: "Annual Activity Report", ta: "வருடாந்திர செயல்பாட்டு அறிக்கைகள்" },
  public_notice: { en: "Public Notice", ta: "பொது அறிவிப்புகள்" },
};

// FEAT-086: only status='published' shown, ordered by category then sortOrder.
export default async function DocumentsPage() {
  const [documents, locale] = await Promise.all([
    prisma.document.findMany({ where: { status: "published" }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    getLocale(),
  ]);
  const langClass = locale === "ta" ? "font-tamil" : "";
  const headingClass = locale === "ta" ? "font-tamil" : "font-display";

  const grouped = documents.reduce<Record<string, typeof documents>>((acc, d) => {
    (acc[d.category] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        kicker={locale === "ta" ? "வெளிப்படைத்தன்மை" : "Public record"}
        title={locale === "ta" ? "ஆவணங்கள்" : "Documents"}
        subtitle={
          locale === "ta"
            ? "இந்தப் பகுதியில் நிர்வாகம் பொதுப் பார்வைக்கு அனுமதிக்கும் ஆவணங்களை மட்டும் வெளியிடப்படும்."
            : "This section publishes only documents the committee has approved for public viewing."
        }
        locale={locale}
      />
      <div className="page-container max-w-4xl py-12 sm:py-16">
        {Object.entries(grouped).map(([category, docs]) => (
          <section key={category} className="mb-14 last:mb-0">
            <h2 className={`border-b border-border pb-4 text-2xl font-semibold text-text-primary ${headingClass}`}>
              {locale === "ta" ? CATEGORY_LABELS[category]?.ta : CATEGORY_LABELS[category]?.en}
            </h2>
            <ul>
              {docs.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 border-b border-border py-5"
                  >
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block font-medium text-text-primary underline-offset-4 group-hover:text-primary group-hover:underline ${langClass}`}
                      >
                        {pick(d.title_en, d.title_ta, locale)}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums text-text-secondary">
                        {d.publishedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                      </span>
                    </span>
                    <Download aria-hidden="true" className="h-5 w-5 shrink-0 text-text-secondary transition-colors group-hover:text-primary" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {documents.length === 0 && (
          <p className={`panel px-6 py-12 text-center text-text-secondary ${langClass}`}>
            {locale === "ta" ? "இதுவரை ஆவணங்கள் வெளியிடப்படவில்லை." : "No documents published yet."}
          </p>
        )}
      </div>
    </>
  );
}
