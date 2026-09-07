/**
 * Build a Shopee Indonesia affiliate redirect URL (an_redir).
 * Optional admin helper — not Open API short-link generation.
 */

const SHOPEE_HOSTS = new Set([
  "shopee.co.id",
  "www.shopee.co.id",
  "s.shopee.co.id",
]);

export function cleanShopeeProductUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!SHOPEE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("URL must be a shopee.co.id product link");
  }

  // If pasting an already-wrapped an_redir link, unwrap origin_link
  if (url.pathname.includes("an_redir")) {
    const origin = url.searchParams.get("origin_link");
    if (!origin) {
      throw new Error("an_redir link is missing origin_link");
    }
    return cleanShopeeProductUrl(origin);
  }

  url.search = "";
  url.hash = "";
  return url.toString();
}

export function buildShopeeAffiliateLink(
  productUrl: string,
  affiliateId: string,
  subId?: string
): string {
  const id = affiliateId.trim();
  if (!id) {
    throw new Error("Shopee Affiliate ID is not set");
  }

  const origin = cleanShopeeProductUrl(productUrl);
  const params = new URLSearchParams();
  params.set("origin_link", origin);
  params.set("affiliate_id", id);
  if (subId?.trim()) {
    params.set("sub_id", subId.trim());
  }

  return `https://s.shopee.co.id/an_redir?${params.toString()}`;
}
