/** Collection promo banner: width:height = 3:1 (e.g. 1200×400). */
export const COLLECTION_BANNER_RATIO = "3:1" as const;
export const COLLECTION_BANNER_SIZE_HINT = "1200×400";
export const COLLECTION_BANNER_MAX = 8;

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
