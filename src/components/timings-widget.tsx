import { Moon, Sparkles, Sun } from "lucide-react";
import { resolveTimings } from "@/lib/timings";
import { pick, type Locale } from "@/lib/i18n";
import TimingCard from "@/components/timing-card";

// FEAT-010: shown on the home page and the Contact page ("home page +
// dedicated section" per the blueprint) — same resolved data, two surfaces.
export default function TimingsWidget({ timingsJson, locale }: { timingsJson: unknown; locale: Locale }) {
  const resolved = resolveTimings(timingsJson);
  const langClass = locale === "ta" ? "font-tamil" : "";

  if (!resolved.standard && !resolved.activeOverride) {
    return (
      <p className={`text-sm text-text-secondary ${langClass}`}>
        {locale === "ta" ? "நேரங்கள் விரைவில் புதுப்பிக்கப்படும்." : "Timings will be posted here shortly."}
      </p>
    );
  }

  if (resolved.activeOverride) {
    const o = resolved.activeOverride;
    return (
      <div className={`border-l-2 border-gold pl-5 ${langClass}`}>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-secondary">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {locale === "ta" ? "இன்று சிறப்பு நேரம்" : "Special Timing Today"}
        </p>
        <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-text-primary sm:text-4xl">
          {o.open} – {o.close}
        </p>
        {(o.note_en || o.note_ta) && <p className="mt-2 text-sm text-text-secondary">{pick(o.note_en ?? "", o.note_ta, locale)}</p>}
      </div>
    );
  }

  return (
    <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <TimingCard
        icon={<Sun className="h-4 w-4" />}
        langClass={langClass}
        label={locale === "ta" ? "காலை" : "Morning"}
        time={`${resolved.standard!.morning.open} – ${resolved.standard!.morning.close}`}
      />
      <TimingCard
        icon={<Moon className="h-4 w-4" />}
        langClass={langClass}
        label={locale === "ta" ? "மாலை" : "Evening"}
        time={`${resolved.standard!.evening.open} – ${resolved.standard!.evening.close}`}
      />
    </div>
  );
}
