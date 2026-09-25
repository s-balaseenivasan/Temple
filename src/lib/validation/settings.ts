import { z } from "zod";

// FEAT-061: SiteSettings is a singleton — this schema updates it, never
// creates/deletes. RULE: malformed map coordinates rejected per the
// blueprint's own error case for this feature.
export const siteSettingsSchema = z.object({
  templeName_en: z.string().trim().min(1, "English temple name is required"),
  templeName_ta: z.string().trim().optional(),
  addressLine_en: z.string().trim().min(1, "English address is required"),
  addressLine_ta: z.string().trim().optional(),
  // Optional, not required: the real seed content has no phone number yet
  // (not provided in the source document), and blocking every other field
  // from being editable until one exists would be a real usability trap,
  // not a meaningful validation — found via testing, not assumed.
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  mapLatitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  mapLongitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  heroImage: z.string().trim().optional(),
});

// FEAT-062: standard timings + a list of dated overrides. Precedence
// (FEAT-010): an override whose date matches today wins over the standard
// timings; RULE-062 duplicate-date validation is enforced here with
// `.refine()` rather than left to the database.
const timeRangeSchema = z.object({
  open: z.string().trim().min(1),
  close: z.string().trim().min(1),
});

export const timingsSchema = z.object({
  morning: timeRangeSchema,
  evening: timeRangeSchema,
  specialDayOverrides: z
    .array(
      z.object({
        date: z.string().trim().min(1),
        open: z.string().trim().min(1),
        close: z.string().trim().min(1),
        note_en: z.string().trim().optional(),
        note_ta: z.string().trim().optional(),
      }),
    )
    .default([])
    .refine(
      (overrides) => new Set(overrides.map((o) => o.date)).size === overrides.length,
      { message: "Duplicate override dates are not allowed" },
    ),
});

export const toggle80gSchema = z.object({
  is80GRegistered: z.coerce.boolean(),
  registration80GNumber: z.string().trim().optional(),
});

// FEAT-012: public contact enquiry. enquirerType is required per brief §11.5.
export const contactEnquirySchema = z.object({
  name: z.string().trim().min(1, "name_required"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "invalid_mobile"),
  email: z.string().email("invalid_email").optional().or(z.literal("")),
  enquirerType: z.enum(["pangali", "bhaktar"], { error: "enquirer_type_required" }),
  message: z.string().trim().min(1, "message_required"),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "responded", "closed"]),
});

// DERIVED: admin CRUD for HistoryTimelineEntry follows the same bilingual
// content-CRUD pattern as News/Event/Video/Committee (FEAT-064) — the
// blueprint's FEAT-002 only specifies the public-facing read side, but an
// entity with no way to populate it would leave that feature half-built.
export const historyEntrySchema = z.object({
  year: z.string().trim().min(1, "Year is required"),
  title_en: z.string().trim().min(1, "English title is required"),
  title_ta: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ta: z.string().trim().optional(),
  image: z.string().trim().optional(),
  sortOrder: z.coerce.number().default(0),
});
