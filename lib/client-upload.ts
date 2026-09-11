import { compressImageFile } from "@/lib/compress-image";

/** Image files from a paste/drop DataTransfer (items first, then files). */
export function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromItems: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  if (fromItems.length > 0) return fromItems;
  return Array.from(data.files ?? []).filter((file) =>
    file.type.startsWith("image/")
  );
}

/** Compress + POST one image to `/api/uploads`; returns the first URL. */
export async function uploadImageFile(file: File): Promise<string> {
  const compressed = await compressImageFile(file);
  const formData = new FormData();
  formData.append("files", compressed);
  const result = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const data = (await result.json().catch(() => null)) as
    | { urls?: string[]; error?: string }
    | null;
  if (!result.ok) throw new Error(data?.error || "Gagal upload");
  const url = data?.urls?.[0];
  if (!url) throw new Error("Gagal upload");
  return url;
}

export type RemoteImageSrc = {
  src: string;
  revoke?: string;
};

/** Resolve a local path or remote http(s) URL into a croppable image src. */
export async function srcFromImageUrl(url: string): Promise<RemoteImageSrc> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL kosong");
  if (trimmed.startsWith("/")) return { src: trimmed };

  const parsed = new URL(trimmed);
  if (!/^https?:$/i.test(parsed.protocol)) throw new Error("URL tidak valid");

  const res = await fetch(trimmed);
  if (!res.ok) throw new Error("Gagal unduh gambar");
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Bukan file gambar");
  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, revoke: objectUrl };
}
