/** Collection promo banner: width:height = 3:2 (e.g. 1200×800). */
export const COLLECTION_BANNER_RATIO = "3:2" as const;
export const COLLECTION_BANNER_SIZE_HINT = "1200×800";
export const COLLECTION_BANNER_MAX = 8;
export const COLLECTION_BANNER_ASPECT = 3 / 2;
export const COLLECTION_BANNER_OUT_WIDTH = 1200;
export const COLLECTION_BANNER_OUT_HEIGHT = 800;

export type CollectionBannerItem = {
  imageUrl: string;
  isHidden: boolean;
};

export function normalizeBannerImages(urls: string[] | undefined): string[] {
  if (!urls) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= COLLECTION_BANNER_MAX) break;
  }
  return out;
}

export function normalizeBannerHidden(
  hidden: string[] | undefined,
  images: string[]
): string[] {
  const allowed = new Set(images);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of hidden ?? []) {
    const url = raw.trim();
    if (!url || !allowed.has(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

export function listBannerItems(
  images: string[] | undefined,
  hidden: string[] | undefined
): CollectionBannerItem[] {
  const urls = normalizeBannerImages(images);
  const hiddenSet = new Set(normalizeBannerHidden(hidden, urls));
  return urls.map((imageUrl) => ({
    imageUrl,
    isHidden: hiddenSet.has(imageUrl),
  }));
}

export function visibleBannerImages(
  images: string[] | undefined,
  hidden: string[] | undefined
): string[] {
  return listBannerItems(images, hidden)
    .filter((item) => !item.isHidden)
    .map((item) => item.imageUrl);
}
