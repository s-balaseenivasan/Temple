import { z } from "zod";

// RULE-017 / FEAT-064: bilingual field pattern — English required, Tamil
// optional-but-encouraged, applied consistently across every content entity.
export const newsSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required"),
  title_ta: z.string().trim().optional(),
  body_en: z.string().trim().min(1, "English body is required"),
  body_ta: z.string().trim().optional(),
  featuredImage: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

// RULE-037-style: YouTube URL/ID only, no self-hosted video (brief §5).
export const videoSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required"),
  title_ta: z.string().trim().optional(),
  videoUrl: z
    .string()
    .trim()
    .regex(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/, "Enter a valid YouTube URL"),
  thumbnail: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ta: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export const eventSchema = z.object({
  name_en: z.string().trim().min(1, "English name is required"),
  name_ta: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ta: z.string().trim().optional(),
  eventDate: z.string().min(1, "Event date is required"), // RULE-023
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  categoryId: z.string().uuid("Select a category"),
  posterImage: z.string().trim().optional(),
  location_en: z.string().trim().optional(),
  location_ta: z.string().trim().optional(),
  specialInstructions_en: z.string().trim().optional(),
  specialInstructions_ta: z.string().trim().optional(),
  contactPersonName: z.string().trim().optional(),
  contactNumber: z.string().trim().optional(),
  registrationRequired: z.coerce.boolean().default(false),
})
  // RULE-023: endTime, if present, must be after startTime (same-day only)
  .refine(
    (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
    { message: "End time must be after start time", path: ["endTime"] },
  );
