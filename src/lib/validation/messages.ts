import type { Locale } from "@/lib/i18n";

// Every custom zod message in src/lib/validation/*.ts for a *public-facing*
// form (donation, receipt lookup, member request — the admin CMS is exempt
// per RULE-017's own text: "the fallback is a public-rendering rule only")
// is a short snake_case key into this dictionary, not literal English text.
// This is the single source of truth for both languages, translated
// server-side before the error ever reaches the client.
export const validationMessages: Record<string, { en: string; ta: string }> = {
  donor_name_required: { en: "Name is required", ta: "பெயர் தேவை" },
  donor_name_length: {
    en: "Name must be between 2 and 100 characters",
    ta: "பெயர் 2 முதல் 100 எழுத்துகளுக்குள் இருக்க வேண்டும்",
  },
  invalid_mobile: {
    en: "Enter a valid 10-digit Indian mobile number",
    ta: "சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடவும்",
  },
  invalid_email: { en: "Enter a valid email address", ta: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்" },
  address_length: {
    en: "Address must be under 500 characters",
    ta: "முகவரி 500 எழுத்துகளுக்குள் இருக்க வேண்டும்",
  },
  invalid_pan: {
    en: "Enter a valid PAN (e.g. ABCDE1234F)",
    ta: "சரியான பான் எண்ணை உள்ளிடவும் (எ.கா. ABCDE1234F)",
  },
  amount_min: { en: "Minimum donation amount is ₹10", ta: "குறைந்தபட்ச நன்கொடைத் தொகை ₹10" },
  amount_max: {
    en: "For donations above ₹5,00,000 please contact the temple office directly",
    ta: "₹5,00,000-க்கு மேற்பட்ட நன்கொடைகளுக்கு நேரடியாக கோவில் அலுவலகத்தைத் தொடர்பு கொள்ளவும்",
  },
  amount_invalid: { en: "Enter a valid amount", ta: "சரியான தொகையை உள்ளிடவும்" },
  purpose_required: { en: "Select a donation purpose", ta: "நன்கொடையின் நோக்கத்தைத் தேர்ந்தெடுக்கவும்" },
  valuation_note_required: {
    en: "Valuation note is required for in-kind (goods/land) donations",
    ta: "பொருள்/நில நன்கொடைகளுக்கு மதிப்பீட்டுக் குறிப்பு தேவை",
  },
  pangali_name_required: { en: "Pangali name is required", ta: "பங்காளி பெயர் தேவை" },
  family_rep_name_required: {
    en: "Family representative name is required",
    ta: "குடும்பப் பிரதிநிதியின் பெயர் தேவை",
  },
  details_required: { en: "Please describe your request", ta: "உங்கள் கோரிக்கையை விவரிக்கவும்" },
  name_required: { en: "Name is required", ta: "பெயர் தேவை" },
  enquirer_type_required: {
    en: "Select whether you are a Pangali or a Bhaktar",
    ta: "நீங்கள் பங்காளியா அல்லது பக்தரா என்பதைத் தேர்ந்தெடுக்கவும்",
  },
  message_required: { en: "Please enter your message", ta: "உங்கள் செய்தியை உள்ளிடவும்" },
  reset_token_required: { en: "This reset link is invalid.", ta: "இந்த மீட்டமைப்பு இணைப்பு தவறானது." },
  password_min_length: { en: "Password must be at least 8 characters", ta: "கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்" },
};

const fallback = {
  en: "Please check this field and try again.",
  ta: "இந்தத் தகவலை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
};

export function localizeMessage(key: string, locale: Locale): string {
  return validationMessages[key]?.[locale] ?? fallback[locale];
}

export function localizeFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
  locale: Locale,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [field, keys] of Object.entries(fieldErrors)) {
    if (!keys) continue;
    out[field] = keys.map((key) => localizeMessage(key, locale));
  }
  return out;
}
