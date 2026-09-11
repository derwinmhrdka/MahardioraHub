import {
  CLIENT_COMPRESS_MAX_EDGE,
  CLIENT_COMPRESS_MIN_QUALITY,
  CLIENT_COMPRESS_TARGET_BYTES,
  MAX_UPLOAD_INPUT_BYTES,
} from "@/lib/uploads-shared";

function loadImageBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Gagal memproses gambar"));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Shrink large photos in the browser before upload.
 * Keeps GIF as-is (server will still normalize). Skips tiny files.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;
  if (file.size > MAX_UPLOAD_INPUT_BYTES) {
    throw new Error("File terlalu besar");
  }
  // Already small enough — still re-encode if huge dimensions later
  const needsWork = file.size > CLIENT_COMPRESS_TARGET_BYTES;

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadImageBitmap(file);
  } catch {
    return file;
  }

  const maxEdge = Math.max(bitmap.width, bitmap.height);
  const scale =
    maxEdge > CLIENT_COMPRESS_MAX_EDGE
      ? CLIENT_COMPRESS_MAX_EDGE / maxEdge
      : 1;

  if (!needsWork && scale >= 1) {
    bitmap.close();
    return file;
  }

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const preferWebp =
    typeof document !== "undefined" &&
    document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  const outType = preferWebp ? "image/webp" : "image/jpeg";
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, outType, quality);

  while (blob.size > CLIENT_COMPRESS_TARGET_BYTES && quality > CLIENT_COMPRESS_MIN_QUALITY) {
    quality = Math.max(CLIENT_COMPRESS_MIN_QUALITY, quality - 0.1);
    blob = await canvasToBlob(canvas, outType, quality);
  }

  // If still huge (rare), shrink dimensions again
  if (blob.size > CLIENT_COMPRESS_TARGET_BYTES * 1.5) {
    const shrink = 0.75;
    const again = document.createElement("canvas");
    again.width = Math.max(1, Math.round(width * shrink));
    again.height = Math.max(1, Math.round(height * shrink));
    const ctx2 = again.getContext("2d");
    if (ctx2) {
      ctx2.drawImage(canvas, 0, 0, again.width, again.height);
      blob = await canvasToBlob(again, outType, CLIENT_COMPRESS_MIN_QUALITY);
    }
  }

  const ext = outType === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, {
    type: outType,
    lastModified: Date.now(),
  });
}

export async function compressImageFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    out.push(await compressImageFile(file));
  }
  return out;
}
