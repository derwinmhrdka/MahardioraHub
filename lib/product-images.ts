/** Normalize product gallery: prefer imageUrls, fall back to imageUrl. */
export function productImages(product: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string[] {
  const fromArray = (product.imageUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  if (fromArray.length > 0) return Array.from(new Set(fromArray));

  const cover = product.imageUrl?.trim();
  return cover ? [cover] : [];
}

export function normalizeImageUrls(urls: string[]): {
  imageUrl: string | null;
  imageUrls: string[];
} {
  const imageUrls = Array.from(
    new Set(urls.map((url) => url.trim()).filter(Boolean))
  );
  return {
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
  };
}

export function parseImageUrlsField(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter(Boolean);
}
