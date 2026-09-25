import { prisma } from "@/lib/prisma";
import { getLocale, pick } from "@/lib/i18n";
import { resolveTimings } from "@/lib/timings";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import TimingsWidget from "@/components/timings-widget";
import SectionHeading from "@/components/section-heading";
import NewsCard from "@/components/news-card";
import DeityCard from "@/components/deity-card";
import QuickLinkCard from "@/components/quick-link-card";
import { ArchFrame, GopuramSilhouette, OrnamentalDivider } from "@/components/decorative";
import Reveal from "@/components/reveal";

export const dynamic = "force-dynamic"; // real data, no stale build-time cache in this early phase

function excerptOf(text: string, max = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

const TAGLINE_TA = "முன்னோர் வழி – தெய்வ பக்தி – பங்காளிகள் ஒற்றுமை – தலைமுறைகள் தொடரும் பாரம்பரியம்";
const TAGLINE_EN = "Our ancestors' path, devotion to God, unity among members — a tradition that continues through generations.";

export default async function HomePage() {
  const [settings, deities, latestNews, locale] = await Promise.all([
    prisma.siteSettings.findFirst(),
    prisma.deity.findMany({ where: { status: "active" }, orderBy: { sortOrder: "asc" } }),
    prisma.news.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" }, take: 3 }),
    getLocale(),
  ]);

  if (!settings) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-text-secondary">
        Site settings have not been configured yet. Run <code>npx prisma db seed</code>.
      </div>
    );
  }

  const ta = locale === "ta";
  const langClass = ta ? "font-tamil" : "";
  const headingClass = ta ? "font-tamil" : "font-display";
  const templeName = pick(settings.templeName_en, settings.templeName_ta, locale);
  const address = pick(settings.addressLine_en, settings.addressLine_ta, locale);

  const timings = resolveTimings(settings.timingsJson);
  const heroHours = timings.activeOverride
    ? [`${timings.activeOverride.open} – ${timings.activeOverride.close}`]
    : timings.standard
      ? [
          `${timings.standard.morning.open} – ${timings.standard.morning.close}`,
          `${timings.standard.evening.open} – ${timings.standard.evening.close}`,
        ]
      : null;

  const toBeUpdated = ta ? "(புதுப்பிக்கப்பட வேண்டும்)" : "(to be updated)";

  return (
    <>
      {/* HERO — split: the temple's name set large on paper, beside an
          arched shrine-niche frame carrying the hero photograph. */}
      <section className="relative overflow-hidden">
        <div
          className="pattern-kolam pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="page-container relative grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-24">
          <div className="animate-fade-up">
            <p className={`kicker ${langClass}`}>{ta ? "ஓம் ஸ்ரீ குருப்யோ நமஹ" : "Om Sri Gurubhyo Namah"}</p>
            <h1
              className={`mt-5 max-w-2xl text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-text-primary sm:text-6xl lg:text-[4.25rem] ${headingClass}`}
            >
              {templeName}
            </h1>
            <p
              className={`mt-6 max-w-xl text-pretty text-lg leading-relaxed text-text-secondary sm:text-xl ${
                ta ? "font-tamil" : "font-display italic"
              }`}
            >
              {ta ? TAGLINE_TA : TAGLINE_EN}
            </p>
            <p className={`mt-6 flex max-w-md items-start gap-2 text-sm text-text-secondary ${langClass}`}>
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{address}</span>
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/donate" className={`btn btn-primary h-12 px-6 text-[0.95rem] ${langClass}`}>
                {ta ? "கோவிலுக்கு நன்கொடை அளிக்க" : "Donate to the Temple"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a href="#history" className={`link-arrow ${langClass}`}>
                {ta ? "கோவிலை அறிந்திடுங்கள்" : "Explore the Temple"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="animate-fade-up relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px]">
            <ArchFrame src={settings.heroImage} alt={templeName} tone="deep" className="aspect-[4/5] w-full" />
            {heroHours && (
              <div className="panel absolute -bottom-6 -left-4 flex items-center gap-3 px-4 py-3 shadow-[0_18px_36px_-18px_rgba(43,18,11,0.45)] sm:-left-10">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-light/40 text-primary">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide text-secondary ${langClass}`}>
                    {ta ? "இன்று திறந்திருக்கும்" : "Open today"}
                  </p>
                  {heroHours.map((h) => (
                    <p key={h} className="font-display text-base font-semibold tabular-nums text-text-primary">
                      {h}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TEMPLE TIMINGS — almanac band */}
      <Reveal as="section" className="border-y border-border bg-surface">
        <div className="page-container grid gap-10 py-14 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div>
            <p className={`kicker ${langClass}`}>{ta ? "தரிசனம்" : "Darshan"}</p>
            <h2 className={`mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl ${headingClass}`}>
              {ta ? "கோவில் நேரங்கள்" : "Temple Timings"}
            </h2>
            <p className={`mt-4 max-w-sm text-text-secondary ${ta ? "font-tamil" : "font-display italic"}`}>
              {ta
                ? "ஸ்ரீ குருசாமி ஸ்ரீ அனந்தம்மாளின் அருள் எப்போதும் உங்களுடன் இருக்கட்டும்."
                : "May the blessings of Sri Gurusamy Sri Ananthammal be with you always."}
            </p>
          </div>
          <TimingsWidget timingsJson={settings.timingsJson} locale={locale} />
        </div>
      </Reveal>

      {/* LATEST NEWS */}
      <Reveal as="section" className="page-container section-y">
        <SectionHeading
          kicker={ta ? "கோவில் அலுவலகத்திலிருந்து" : "From the temple office"}
          title={ta ? "சமீபத்திய செய்திகள்" : "Latest News"}
          locale={locale}
          viewAllHref="/news"
          viewAllLabel={ta ? "அனைத்து செய்திகளையும் காண்க" : "View all news"}
        />
        {latestNews.length > 0 ? (
          <div className="-mt-4 divide-y divide-border border-b border-border">
            {latestNews.map((n) => (
              <NewsCard
                key={n.id}
                href={`/news/${n.id}`}
                title={pick(n.title_en, n.title_ta, locale)}
                excerpt={excerptOf(pick(n.body_en, n.body_ta, locale))}
                date={n.publishedAt}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className={`text-text-secondary ${langClass}`}>{ta ? "இதுவரை செய்திகள் வெளியிடப்படவில்லை." : "No news published yet."}</p>
        )}
        <Link href="/news" className={`link-arrow mt-8 sm:hidden ${langClass}`}>
          {ta ? "அனைத்து செய்திகளையும் காண்க" : "View all news"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Reveal>

      {/* TEMPLE HISTORY */}
      <Reveal as="section" id="history" className="scroll-mt-24 bg-surface-muted/60">
        <div className="page-container section-y grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <ArchFrame alt="" className="mx-auto aspect-[4/5] w-full max-w-[340px]" />
          <div>
            <p className={`kicker ${langClass}`}>{ta ? "எங்கள் பாரம்பரியம்" : "Our heritage"}</p>
            <h2 className={`mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl ${headingClass}`}>
              {ta ? "கோவில் வரலாறு" : "Temple History"}
            </h2>
            <p className={`mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-text-secondary ${langClass}`}>
              {pick(settings.historyIntro_en, settings.historyIntro_ta, locale)}
            </p>
            <Link href="/history" className={`btn btn-outline mt-8 ${langClass}`}>
              {ta ? "முழு வரலாறு மற்றும் காலவரிசையைக் காண்க" : "View full history & timeline"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* DEITIES */}
      <Reveal as="section" className="page-container section-y">
        <SectionHeading
          align="center"
          kicker={ta ? "சன்னதிகள்" : "Sannidhi"}
          title={ta ? "தெய்வங்கள்" : "Deities"}
          locale={locale}
        />
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
          {deities.map((deity, i) => (
            <Reveal key={deity.id} delayMs={i * 60}>
              <DeityCard name={pick(deity.name_en, deity.name_ta, locale)} image={deity.image} langClass={langClass} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link href="/deities" className={`link-arrow ${langClass}`}>
            {ta ? "அனைத்து தெய்வங்களையும் காண்க" : "View all deities"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      {/* QUICK ACCESS — numbered index with hairline grid */}
      <Reveal as="section" className="page-container pb-[clamp(64px,9vw,112px)]">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <QuickLinkCard
            href="/pooja-festivals"
            index={1}
            langClass={langClass}
            label={ta ? "பூஜைகள் மற்றும் திருவிழாக்கள்" : "Pooja & Festivals"}
            description={ta ? "தினசரி பூஜைகள் மற்றும் ஆண்டு திருவிழாக்கள்" : "Daily poojas and the festivals of the temple year"}
          />
          <QuickLinkCard
            href="/administration"
            index={2}
            langClass={langClass}
            label={ta ? "நிர்வாகம்" : "Administration"}
            description={ta ? "கோவில் நிர்வாக அமைப்பு மற்றும் செயற்குழு" : "How the temple is governed, and by whom"}
          />
          <QuickLinkCard
            href="/bhaktha-sabha"
            index={3}
            langClass={langClass}
            label={ta ? "பக்த சபை" : "Bhaktha Sabha"}
            description={ta ? "பக்தர்களின் சங்கமம்" : "The fellowship of devotees"}
          />
          <QuickLinkCard
            href="/welfare"
            index={4}
            langClass={langClass}
            label={ta ? "நலப்பணிகள்" : "Welfare Works"}
            description={ta ? "சமூக நலத் திட்டங்கள்" : "Community support programmes"}
          />
        </div>
      </Reveal>

      {/* DONATION BAND */}
      <Reveal as="section" className="page-container">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-white sm:px-12 sm:py-16 lg:px-16">
          <div className="pattern-kolam pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />
          <GopuramSilhouette className="pointer-events-none absolute -bottom-6 right-6 hidden h-[115%] w-auto text-gold-light/25 md:block" />
          <div className="relative max-w-2xl">
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-gold-light ${langClass}`}>
              {ta ? "கோவிலை ஆதரிக்க" : "Support the temple"}
            </p>
            <h2 className={`mt-3 text-balance text-3xl font-semibold leading-tight sm:text-4xl ${headingClass}`}>
              {ta
                ? "உங்கள் காணிக்கை தலைமுறைகள் தொடரும் பாரம்பரியத்தைக் காக்கிறது"
                : "Your offering keeps a generations-old tradition alive"}
            </h2>
            <p className={`mt-4 max-w-xl text-white/85 ${langClass}`}>
              {ta
                ? "உங்கள் நன்கொடை கோவில் பராமரிப்பு மற்றும் நலப்பணிகளுக்கு பயன்படுத்தப்படுகிறது. ஒவ்வொரு நன்கொடைக்கும் ரசீது வழங்கப்படும்."
                : "Donations fund temple upkeep, poojas and community welfare works. Every donation receives a receipt."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/donate" className={`btn btn-gold h-12 px-6 ${langClass}`}>
                {ta ? "நன்கொடை அளிக்க" : "Donate Now"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/donate/receipt-lookup"
                className={`text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white hover:decoration-white ${langClass}`}
              >
                {ta ? "ரசீதைத் தேடுக" : "Find a past receipt"}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* CONTACT */}
      <Reveal as="section" className="page-container section-y">
        <SectionHeading
          align="center"
          kicker={ta ? "எங்களை சந்திக்க" : "Visit us"}
          title={ta ? "தொடர்புக்கு" : "Contact"}
          locale={locale}
        />
        <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <ContactItem icon={<MapPin className="h-5 w-5" />} label={ta ? "முகவரி" : "Address"} langClass={langClass}>
            {address}
          </ContactItem>
          <ContactItem icon={<Phone className="h-5 w-5" />} label={ta ? "தொலைபேசி" : "Phone"} langClass={langClass}>
            {settings.phone || toBeUpdated}
          </ContactItem>
          <ContactItem icon={<Mail className="h-5 w-5" />} label={ta ? "மின்னஞ்சல்" : "Email"} langClass={langClass}>
            <span className="break-all">{settings.email || toBeUpdated}</span>
          </ContactItem>
        </div>
        <div className="mt-10 flex flex-col items-center gap-6">
          <Link href="/contact" className={`btn btn-primary ${langClass}`}>
            {ta ? "வரைபடம் மற்றும் தொடர்பு படிவத்தைக் காண" : "View map & send us a message"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <OrnamentalDivider />
        </div>
      </Reveal>
    </>
  );
}

function ContactItem({
  icon,
  label,
  langClass,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  langClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 text-primary">
        {icon}
      </span>
      <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-secondary ${langClass}`}>{label}</p>
      <p className={`max-w-xs text-text-primary ${langClass}`}>{children}</p>
    </div>
  );
}
