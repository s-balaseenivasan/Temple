import { z } from "zod";

export const galleryAlbumSchema = z.object({
  title_en: z.string().trim().min(1, "English title is required"),
  title_ta: z.string().trim().optional(),
  category: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
  date: z.string().trim().optional(),
  description_en: z.string().trim().optional(),
  description_ta: z.string().trim().optional(),
});

export const galleryPhotoSchema = z.object({
  albumId: z.string().uuid(),
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  caption_en: z.string().trim().optional(),
  caption_ta: z.string().trim().optional(),
  sortOrder: z.coerce.number().default(0),
});
