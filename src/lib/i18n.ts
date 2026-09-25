import { cookies } from "next/headers";

export type Locale = "en" | "ta";

// CONFIRMED override (stakeholder instruction, supersedes the blueprint's
// earlier "default English" ASSUMPTION in RULE-018): default language is
// Tamil, not English. Logged here since it's a real requirement change, not
// silently applied.
export const DEFAULT_LOCALE: Locale = "ta";
export const LOCALE_COOKIE = "lang";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "en" || value === "ta" ? value : DEFAULT_LOCALE;
}

/**
 * RULE-017 bilingual fallback: only ONE language is ever rendered to the
 * visitor at a time (per explicit instruction — no more showing both EN/TA
 * simultaneously). If the active locale is Tamil but the Tamil value is
 * missing/empty, fall back to English so the page never shows a blank field.
 */
export function pick(en: string, ta: string | null | undefined, locale: Locale): string {
  if (locale === "ta" && ta && ta.trim().length > 0) return ta;
  return en;
}

export function isFallback(ta: string | null | undefined, locale: Locale): boolean {
  return locale === "ta" && (!ta || ta.trim().length === 0);
}
