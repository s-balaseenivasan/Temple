import { z } from "zod";

export const documentSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required"),
  title_ta: z.string().trim().optional(),
  category: z.enum(["registration_info", "bylaws", "agm_report", "annual_activity_report", "public_notice"]),
  fileUrl: z.string().trim().min(1, "File URL is required"),
  publishedDate: z.string().trim().min(1, "Published date is required"),
  sortOrder: z.coerce.number().default(0),
});
