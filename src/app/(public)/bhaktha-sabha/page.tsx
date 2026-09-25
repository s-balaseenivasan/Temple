import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import PageHeader from "@/components/page-header";
import { LotusIcon, OrnamentalDivider } from "@/components/decorative";

export const dynamic = "force-dynamic";

export default async function BhakthaSabhaPage() {
  const [settings, locale] = await Promise.all([prisma.siteSettings.findFirst(), getLocale()]);
  const langClass = locale === "ta" ? "font-tamil" : "";

  return (
    <>
      <PageHeader kicker={locale === "ta" ? "பக்தர்கள்" : "Fellowship"} title={locale === "ta" ? "பக்த சபை" : "Bhaktha Sabha"} locale={locale} />
      <div className="page-container flex max-w-3xl flex-col items-center py-14 text-center sm:py-20">
        <LotusIcon className="h-10 w-10 text-primary/70" />
        <p className={`mt-8 text-pretty text-xl leading-relaxed text-text-primary sm:text-2xl sm:leading-relaxed ${langClass}`}>
          {settings ? pick(settings.bhakthaSabhaIntro_en, settings.bhakthaSabhaIntro_ta, locale) : ""}
        </p>
        <OrnamentalDivider className="mt-12" />
      </div>
    </>
  );
}
