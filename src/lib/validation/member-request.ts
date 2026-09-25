import { z } from "zod";

// FEAT-081 / ENT-21 MemberRequest: a lightweight request/intake record, not a
// full family-genealogy data model (that stays with the committee's offline
// records per the brief's explicit scope boundary — see _CONTEXT_BRIEF.md §11.3).
// NOTE: messages below are short snake_case keys into
// src/lib/validation/messages.ts — this form is public-facing.
export const memberRequestSchema = z.object({
  requestType: z.enum(["registration", "family_update", "contact_update", "matrimony_update"]),
  pangaliName: z.string().trim().min(1, "pangali_name_required"),
  familyRepresentativeName: z.string().trim().min(1, "family_rep_name_required"),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "invalid_mobile"),
  email: z.string().email("invalid_email").optional().or(z.literal("")),
  lineageBranch: z.string().trim().optional(),
  details: z.string().trim().min(1, "details_required"),
});
