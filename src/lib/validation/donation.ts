import { z } from "zod";

// RULE-005: donor identity field validation
// NOTE: all messages below are short snake_case keys into
// src/lib/validation/messages.ts, not literal English text — this form is
// public-facing and must render errors in the visitor's chosen locale.
export const donationFormSchema = z.object({
  donorName: z.string().trim().min(2, "donor_name_length").max(100, "donor_name_length"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "invalid_mobile"),
  email: z.string().email("invalid_email").optional().or(z.literal("")),
  address: z.string().max(500, "address_length").optional().or(z.literal("")),
  // RULE-006: PAN optional, standard format when present
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "invalid_pan")
    .optional()
    .or(z.literal("")),
  // RULE-002/003: min ₹10, max ₹5,00,000 per transaction (ASSUMPTION, flagged in blueprint)
  amount: z.coerce
    .number("amount_invalid")
    .min(10, "amount_min")
    .max(500000, "amount_max"),
  purposeId: z.string().uuid("purpose_required"),
  anonymous: z.coerce.boolean().default(false),
});

export type DonationFormInput = z.infer<typeof donationFormSchema>;

// RULE-016: compound-key lookup, both fields required
export const receiptLookupSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  receiptNumber: z.string().min(1),
});

// EP-46 / RULE-041: offline/in-kind donation recording (admin only — English
// error text is fine here, per RULE-017's admin-CMS exemption).
export const offlineDonationSchema = z.object({
  donorName: z.string().trim().min(2).max(100),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  purposeId: z.string().uuid(),
  anonymous: z.coerce.boolean().default(false),
  donationType: z.enum(["cash_offline", "in_kind_goods", "in_kind_land"]),
  valuationNote: z.string().trim().min(1).optional(),
})
  // RULE-042: valuationNote required for in-kind types
  .refine(
    (data) => data.donationType === "cash_offline" || !!data.valuationNote,
    { message: "Valuation note is required for in-kind (goods/land) donations", path: ["valuationNote"] },
  );
