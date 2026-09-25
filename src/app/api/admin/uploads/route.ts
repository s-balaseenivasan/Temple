import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Generous enough for an unedited phone/DSLR photo (commonly 10-20MB at full
// resolution) — Cloudinary resizes/optimizes on upload (see cloudinary.ts),
// so the constraint here is only "don't accept something absurd", not
// "must already be web-sized".
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

// Folder must be one of a known set of admin sections — never taken as a
// free-form path from the client, to keep uploads confined to predictable
// Cloudinary folders under "temple/".
const ALLOWED_FOLDERS = new Set([
  "deities",
  "site-settings",
  "committee",
  "news",
  "events",
  "gallery",
  "history",
  "videos",
]);

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "invalid_folder" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadToCloudinary(buffer, folder);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  }
}
