import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const BUCKET = process.env.SUPABASE_AVATAR_BUCKET ?? "avatars";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// 5 MB decoded ceiling for profile images.
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Sniff the leading bytes of a decoded image to confirm it matches the declared
 * content type. Prevents uploading arbitrary bytes with a spoofed MIME type.
 */
function matchesSignature(buf: Buffer, contentType: string): boolean {
  const type = contentType.toLowerCase();
  if (type === "image/png") {
    return (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (type === "image/jpeg" || type === "image/jpg") {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (type === "image/gif") {
    return (
      buf.length >= 6 &&
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39) &&
      buf[5] === 0x61
    );
  }
  if (type === "image/webp") {
    // "RIFF" .... "WEBP"
    return (
      buf.length >= 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

export class StorageError extends Error {
  readonly code: "not_configured" | "invalid_image" | "upload_failed";
  constructor(code: StorageError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

let cached: SupabaseClient | null = null;
let bucketReady = false;

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new StorageError(
      "not_configured",
      "Image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

async function ensureBucket(client: SupabaseClient): Promise<void> {
  if (bucketReady) return;
  const { data, error } = await client.storage.getBucket(BUCKET);
  if (error && !data) {
    const created = await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
    });
    if (created.error && !/already exists/i.test(created.error.message)) {
      throw new StorageError(
        "upload_failed",
        `Could not create storage bucket: ${created.error.message}`,
      );
    }
  }
  bucketReady = true;
}

export interface UploadResult {
  publicUrl: string;
}

/**
 * Upload a base64-encoded image to Supabase Storage and return its public URL.
 * Validates MIME type and decoded size before uploading.
 */
export async function uploadAvatarImage(
  userId: number,
  imageBase64: string,
  contentType: string,
): Promise<UploadResult> {
  const ext = ALLOWED_TYPES[contentType.toLowerCase()];
  if (!ext) {
    throw new StorageError(
      "invalid_image",
      "Unsupported image type. Use PNG, JPEG, WebP, or GIF.",
    );
  }

  const normalized = imageBase64.replace(/^data:[^;]+;base64,/, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(normalized, "base64");
  } catch {
    throw new StorageError("invalid_image", "Image data is not valid base64.");
  }
  if (buffer.length === 0) {
    throw new StorageError("invalid_image", "Image is empty.");
  }
  if (buffer.length > MAX_BYTES) {
    throw new StorageError("invalid_image", "Image is larger than 5 MB.");
  }
  if (!matchesSignature(buffer, contentType)) {
    throw new StorageError(
      "invalid_image",
      "File content does not match a valid PNG, JPEG, WebP, or GIF image.",
    );
  }

  const client = getClient();
  await ensureBucket(client);

  const objectPath = `${userId}/${Date.now()}.${ext}`;
  const { error } = await client.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    logger.error({ err: error }, "Supabase avatar upload failed");
    throw new StorageError("upload_failed", "Could not upload the image.");
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl };
}
