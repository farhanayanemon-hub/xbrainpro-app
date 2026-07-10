import { createHash } from "node:crypto";
import { type Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 client (S3-compatible).
 *
 * The bucket is private: the provided R2 "public" URL is actually the S3 API
 * endpoint (auth-required), enabling r2.dev needs a Cloudflare API token we
 * don't have, and the object-scoped S3 credentials can't set a bucket CORS
 * policy. So the game reads assets by *streaming them through the API server*
 * (`getObject` below) — same-origin, so it works in the browser/Expo-web with
 * no CORS config, and the native client caches each file on disk by content
 * hash so it's only fetched once.
 */

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.R2_BUCKET_NAME?.trim();

/** Whether R2 is fully configured. When false, the pipeline degrades to bundled assets. */
export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured (missing Cloudflare/R2 secrets)");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

export function r2Bucket(): string {
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  return bucket;
}

/** SHA-256 hex digest of a buffer — used for cache-busting on the client. */
export function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }),
  );
}

/** Fetch an object's bytes as a stream, for proxying to clients same-origin. */
export async function getObject(key: string): Promise<{
  body: Readable;
  contentType?: string;
  contentLength?: number;
}> {
  const out = await getClient().send(
    new GetObjectCommand({ Bucket: r2Bucket(), Key: key }),
  );
  return {
    body: out.Body as Readable,
    contentType: out.ContentType,
    contentLength: out.ContentLength,
  };
}

/** Generate a temporary signed download URL. Max 7 days per SigV4. */
export async function presignGet(
  key: string,
  expiresIn = 60 * 60 * 24 * 7,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: r2Bucket(), Key: key }),
    { expiresIn },
  );
}
