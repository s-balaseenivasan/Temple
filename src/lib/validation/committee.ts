import { z } from "zod";

// RULE-025/brief §1: no financial linkage of any kind — this schema
// deliberately has no field that could reference Donation/Payment/Receipt.
export const committeeMemberSchema = z.object({
  photo: z.string().trim().optional(),
  name_en: z.string().trim().min(1, "English name is required"),
  name_ta: z.string().trim().optional(),
  designationId: z.string().uuid("Select a designation"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  publicMobileVisible: z.coerce.boolean().default(false),
  email: z.string().email().optional().or(z.literal("")),
  bio_en: z.string().trim().optional(),
  bio_ta: z.string().trim().optional(),
  displayOrder: z.coerce.number().default(0),
});

export const designationSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_ta: z.string().trim().optional(),
  sortOrder: z.coerce.number().default(0),
});
