import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

let configured: boolean | undefined;
function isConfigured() {
  if (configured !== undefined) return configured;
  configured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return configured;
}

/**
 * Upload an in-memory file buffer to Cloudinary under the "temple/" prefix
 * (this project's Cloudinary account is shared with parking-management-system;
 * the prefix keeps the two apps' media apart), returning its secure URL.
 * resource_type: "auto" lets Cloudinary route images vs video correctly.
 *
 * Full-resolution phone/camera photos (6000x4000, 15MB+) are common admin
 * uploads here — resized down to a 2400px-wide JPEG/WEBP-quality-85 buffer
 * *before* upload, both because this account's plan hard-rejects anything
 * over 10MB (found via direct testing, not documented anywhere obvious) and
 * because no layout on this site needs pixels beyond that anyway. `.rotate()`
 * with no args applies the file's own EXIF orientation and then strips it —
 * without it, photos taken in portrait on a phone render sideways once
 * Cloudinary/browsers stop honoring the tag that told them which way was up.
 */
async function resizeForUpload(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer).rotate();
  const metadata = await image.metadata();
  const resized = image.resize({ width: 2400, withoutEnlargement: true });
  return metadata.format === "png" ? resized.png({ compressionLevel: 8 }).toBuffer() : resized.jpeg({ quality: 85 }).toBuffer();
}

export async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  if (!isConfigured()) throw new Error("Image uploads are not configured (missing CLOUDINARY_* env vars)");

  const resized = await resizeForUpload(buffer);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: `temple/${folder}`, resource_type: "auto" }, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
      resolve(result.secure_url);
    });
    stream.end(resized);
  });
}
