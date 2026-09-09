import { randomUUID } from "crypto";
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  MAX_IMAGE_EDGE,
  MAX_UPLOAD_BYTES,
  WEBP_QUALITY,
} from "@/lib/uploads-shared";

export {
  MAX_UPLOAD_BYTES,
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

export async function saveProductImage(file: File): Promise<string> {
  const mime =
    file.type ||
    (file.name.toLowerCase().endsWith(".png")
      ? "image/png"
      : file.name.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : file.name.toLowerCase().endsWith(".gif")
          ? "image/gif"
          : file.name.toLowerCase().match(/\.(jpe?g)$/)
            ? "image/jpeg"
            : "");

  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Format gambar tidak didukung");
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran file max 5MB");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });

  const output = await sharp(input)
    .rotate()
    .resize({
      width: MAX_IMAGE_EDGE,
      height: MAX_IMAGE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

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
