import { getLocale } from "@/lib/i18n";
import MemberRequestForm from "./member-request-form";
import PageHeader from "@/components/page-header";

export const dynamic = "force-dynamic";

// FEAT-080/081: informational page + admin-managed request-intake form.
// No member login exists (stakeholder decision, _CONTEXT_BRIEF.md §11.6) —
// the actual family/genealogy register stays with the committee's offline
// records; this form only creates a lightweight MemberRequest for the office
// to act on.
export default async function PangaligalPage() {
  const locale = await getLocale();
  const ta = locale === "ta";
  const langClass = ta ? "font-tamil" : "";
  const headingClass = ta ? "font-tamil" : "font-display";

  const steps = ta
    ? ["கோரிக்கை வகையைத் தேர்ந்தெடுக்கவும்", "குடும்ப மற்றும் தொடர்பு விவரங்களை நிரப்பவும்", "நிர்வாகக் கமிட்டி உங்களைத் தொடர்பு கொள்ளும்"]
    : ["Choose the kind of request", "Fill in family and contact details", "The managing committee contacts you"];

  return (
    <>
      <PageHeader
        kicker={ta ? "குடும்ப வழி" : "Lineage"}
        title={ta ? "பங்காளிகள்" : "Pangaligal / Members"}
        locale={locale}
      />
      <div className="page-container grid gap-12 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className={`text-pretty text-lg leading-relaxed text-text-primary ${langClass}`}>
            {ta
              ? "பாரம்பரிய குடும்ப வழிமுறைகளையும் நிர்வாக விதிமுறைகளையும் பின்பற்றி தகுதியுடையவர்கள் உறுப்பினர்களாக சேர்க்கப்படுகின்றனர். புதிய பதிவு அல்லது குடும்பம் / தொடர்பு / மகமை விவரங்களைப் புதுப்பிக்க கீழே உள்ள படிவத்தைப் பயன்படுத்தவும். உங்கள் கோரிக்கை நிர்வாகக் கமிட்டியால் நேரடியாக செயலாக்கப்படும்."
              : "Membership follows traditional family lineage and the committee's administrative rules. Use the form below to request new registration or update family, contact, or matrimony (மகமை) details. Your request is processed directly by the managing committee — no login is required."}
          </p>
          <h2 className={`mt-12 text-2xl font-semibold text-text-primary ${headingClass}`}>{ta ? "எப்படி செயல்படுகிறது" : "How it works"}</h2>
          <ol className="mt-4 border-t border-border">
            {steps.map((step, i) => (
              <li key={step} className="flex items-baseline gap-5 border-b border-border py-5">
                <span className="font-display text-2xl font-semibold tabular-nums text-secondary">{String(i + 1).padStart(2, "0")}</span>
                <span className={`text-text-primary ${langClass}`}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="panel self-start p-6 sm:p-10">
          <MemberRequestForm locale={locale} />
        </div>
      </div>
    </>
  );
}
