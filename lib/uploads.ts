import { randomUUID } from "crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  MAX_IMAGE_EDGE,
  MAX_UPLOAD_INPUT_BYTES,
  WEBP_QUALITY,
} from "@/lib/uploads-shared";

export {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_INPUT_BYTES,
  MAX_UPLOAD_COUNT,
  MAX_IMAGE_EDGE,
  WEBP_QUALITY,
} from "@/lib/uploads-shared";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Files newer than this are kept by orphan sweep (unsaved form uploads). */
export const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

export function getUploadDir(): string {
  return path.join(process.cwd(), "uploads");
}

export function publicUploadPath(filename: string): string {
  return `/uploads/${filename}`;
}

export function filenameFromUploadUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      pathname = new URL(trimmed).pathname;
    }
  } catch {
    return null;
  }

  const match = pathname.match(/^\/uploads\/([a-zA-Z0-9._-]+)$/);
  return match?.[1] ?? null;
}

export function isLocalUploadUrl(url: string): boolean {
  return filenameFromUploadUrl(url) != null;
}

export function normalizeLocalUploadUrl(url: string): string | null {
  const name = filenameFromUploadUrl(url);
  return name ? publicUploadPath(name) : null;
}

export function resolveUploadFile(filename: string): string | null {
  const safe = path.basename(filename);
  if (!safe || safe.includes("..") || !/^[a-zA-Z0-9._-]+$/.test(safe)) {
    return null;
  }
  return path.join(getUploadDir(), safe);
}

export async function saveProductImage(file: File | Blob): Promise<string> {
  const named = file as File;
  let mime = (file.type || "").toLowerCase().trim();
  if (!mime || mime === "application/octet-stream") {
    const name = typeof named.name === "string" ? named.name.toLowerCase() : "";
    if (name.endsWith(".png")) mime = "image/png";
    else if (name.endsWith(".webp")) mime = "image/webp";
    else if (name.endsWith(".gif")) mime = "image/gif";
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) mime = "image/jpeg";
    else mime = "image/jpeg";
  }

  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Format gambar tidak didukung");
  }
  if (file.size <= 0) {
    throw new Error("File kosong");
  }
  if (file.size > MAX_UPLOAD_INPUT_BYTES) {
    throw new Error("Ukuran file terlalu besar (max 20MB)");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });

  let output: Buffer;
  try {
    let quality = WEBP_QUALITY;
    let edge = MAX_IMAGE_EDGE;
    const pipeline = () =>
      sharp(input)
        .rotate()
        .resize({
          width: edge,
          height: edge,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality });

    output = await pipeline().toBuffer();

    // Extra pass if still large (rare for already-compressed client uploads)
    while (output.length > 2.5 * 1024 * 1024 && (quality > 50 || edge > 1000)) {
      if (quality > 50) quality -= 10;
      else edge = Math.round(edge * 0.85);
      output = await pipeline().toBuffer();
    }
  } catch {
    throw new Error("Gambar tidak bisa diproses");
  }

  await writeFile(path.join(dir, filename), output);
  return publicUploadPath(filename);
}

async function unlinkUploadFilename(filename: string): Promise<boolean> {
  const full = resolveUploadFile(filename);
  if (!full) return false;
  try {
    await unlink(full);
    return true;
  } catch {
    return false;
  }
}

/** Delete local upload files that are not referenced by any product. */
export async function deleteUploadsIfUnreferenced(
  urls: string[],
  referenced: Set<string>
): Promise<number> {
  let deleted = 0;
  const seen = new Set<string>();

  for (const url of urls) {
    const normalized = normalizeLocalUploadUrl(url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    if (referenced.has(normalized)) continue;
    const name = filenameFromUploadUrl(normalized);
    if (!name) continue;
    if (await unlinkUploadFilename(name)) deleted += 1;
  }

  return deleted;
}

export async function listLocalUploadFilenames(): Promise<string[]> {
  const dir = getUploadDir();
  try {
    const entries = await readdir(dir);
    return entries.filter((name) => /^[a-zA-Z0-9._-]+$/.test(name));
  } catch {
    return [];
  }
}

/**
 * Remove disk files not referenced in DB.
 * Skips files younger than graceMs to avoid wiping unsaved form uploads.
 */
export async function purgeOrphanUploads(
  referenced: Set<string>,
  graceMs = ORPHAN_GRACE_MS
): Promise<number> {
  const dir = getUploadDir();
  const names = await listLocalUploadFilenames();
  const now = Date.now();
  let deleted = 0;

  for (const name of names) {
    const publicPath = publicUploadPath(name);
    if (referenced.has(publicPath)) continue;

    const full = resolveUploadFile(name);
    if (!full) continue;

    try {
      const info = await stat(full);
      if (now - info.mtimeMs < graceMs) continue;
      await unlink(full);
      deleted += 1;
    } catch {
      // ignore
    }
  }

  return deleted;
}
