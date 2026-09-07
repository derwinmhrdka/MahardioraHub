/** Cap remote product images so huge marketplace files don't blow layout/bandwidth. */
export function productImageUrl(
  url: string | null | undefined,
  width = 450
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Shopee CDN supports @resize_wN_nl suffix
    if (host.includes("susercontent.com") || host.includes("shopee.")) {
      const base = `${parsed.origin}${parsed.pathname}`.replace(
        /@resize_w\d+_nl/i,
        ""
      );
      return `${base}@resize_w${width}_nl${parsed.search}`;
    }
  } catch {
    // keep original
  }

  return trimmed;
}
