import { z } from "zod";

export const deitySchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_ta: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ta: z.string().trim().optional(),
  image: z.string().trim().optional(),
  sortOrder: z.coerce.number().default(0),
});
