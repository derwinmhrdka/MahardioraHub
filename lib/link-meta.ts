export type ProductLinkMeta = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  platform: string | null;
  source: "shopee-api" | "open-graph" | "mixed";
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const SHARE_UA = "WhatsApp/2.23.20.0";

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  ms = 12000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function absoluteUrl(base: string, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseJsonLdPrice(html: string): number | null {
  const scripts = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return null;

  for (const block of scripts) {
    const raw = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      const data = JSON.parse(raw) as unknown;
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const price = digOfferPrice(node);
        if (price != null) return price;
      }
    } catch {
      // ignore bad JSON-LD
    }
  }
  return null;
}

function digOfferPrice(node: unknown): number | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const offers = obj.offers;
  if (offers && typeof offers === "object") {
    const offerList = Array.isArray(offers) ? offers : [offers];
    for (const offer of offerList) {
      if (!offer || typeof offer !== "object") continue;
      const price = Number((offer as Record<string, unknown>).price);
      if (Number.isFinite(price) && price > 0) return Math.round(price);
    }
  }
  if (Array.isArray(obj["@graph"])) {
    for (const child of obj["@graph"]) {
      const price = digOfferPrice(child);
      if (price != null) return price;
    }
  }
  return null;
}

export function parseShopeeIds(
  rawUrl: string
): { shopId: string; itemId: string } | null {
  try {
    const url = new URL(rawUrl.trim());
    if (!url.hostname.toLowerCase().includes("shopee.")) return null;

    const patterns = [
      /(?:^|\/)(?:a-)?i\.(\d+)\.(\d+)/i,
      /\/product\/(\d+)\/(\d+)/i,
      /\/opaanlp\/(\d+)\/(\d+)/i,
    ];
    for (const pattern of patterns) {
      const match = url.pathname.match(pattern);
      if (match) return { shopId: match[1], itemId: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}

function detectPlatform(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (host.includes("shopee.")) return "Shopee";
  if (host.includes("tokopedia.")) return "Tokopedia";
  if (host.includes("lazada.")) return "Lazada";
  if (host.includes("tiktok.")) return "TikTok";
  return null;
}

function shopeePriceToIdr(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 100000) return Math.round(n / 100000);
  return Math.round(n);
}

/** Follow redirects without downloading large SPA bodies along the way. */
async function resolveRedirectUrl(rawUrl: string): Promise<string> {
  let current = rawUrl;
  for (let i = 0; i < 8; i++) {
    const res = await fetchWithTimeout(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": BROWSER_UA,
      },
      next: { revalidate: 0 },
    });
    const location = res.headers.get("location");
    if (!location) return res.url || current;
    current = new URL(location, current).toString();
  }
  return current;
}

async function fetchShopeeApiMeta(
  shopId: string,
  itemId: string
): Promise<Partial<ProductLinkMeta> | null> {
  const endpoint = `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
  const res = await fetchWithTimeout(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": BROWSER_UA,
      Referer: "https://shopee.co.id/",
      "X-Requested-With": "XMLHttpRequest",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    error?: number;
    data?: {
      item?: Record<string, unknown>;
      item_basic?: Record<string, unknown>;
    };
  };
  if (json.error) return null;
  const item = json.data?.item ?? json.data?.item_basic;
  if (!item) return null;

  const title = typeof item.name === "string" ? item.name : null;
  const description =
    typeof item.description === "string"
      ? item.description.replace(/\s+/g, " ").slice(0, 120)
      : null;
  const price =
    shopeePriceToIdr(item.price) ??
    shopeePriceToIdr(item.price_min) ??
    null;
  let imageUrl: string | null = null;
  const image = item.image;
  if (typeof image === "string" && image) {
    imageUrl = image.startsWith("http")
      ? image
      : `https://down-id.img.susercontent.com/file/${image}`;
  } else if (Array.isArray(item.images) && typeof item.images[0] === "string") {
    const first = item.images[0] as string;
    imageUrl = first.startsWith("http")
      ? first
      : `https://down-id.img.susercontent.com/file/${first}`;
  }

  if (!title && !description && !imageUrl && price == null) return null;
  return {
    title,
    description,
    imageUrl,
    price,
    platform: "Shopee",
    source: "shopee-api",
  };
}

function parseHtmlMeta(
  html: string,
  finalUrl: string
): Partial<ProductLinkMeta> {
  let hostname = "";
  try {
    hostname = new URL(finalUrl).hostname;
  } catch {
    hostname = "";
  }

  const title =
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    null;
  const description =
    metaContent(html, "og:description") ||
    metaContent(html, "twitter:description") ||
    metaContent(html, "description") ||
    null;
  const imageUrl = absoluteUrl(
    finalUrl,
    metaContent(html, "og:image") || metaContent(html, "twitter:image")
  );
  const priceRaw =
    metaContent(html, "product:price:amount") ||
    metaContent(html, "og:price:amount");
  let price = priceRaw
    ? Math.round(Number(priceRaw.replace(/[^\d.]/g, "")))
    : null;
  if (!Number.isFinite(price as number) || (price as number) <= 0) {
    price = parseJsonLdPrice(html);
  }

  // Drop Shopee's generic homepage title
  const cleanedTitle =
    title && !/^Shopee Indonesia/i.test(title) && !/something is missing/i.test(title)
      ? title
      : null;

  return {
    title: cleanedTitle,
    description: description ? description.slice(0, 120) : null,
    imageUrl,
    price,
    platform: detectPlatform(hostname),
    source: "open-graph",
  };
}

async function fetchOpenGraphMeta(
  rawUrl: string,
  userAgent = BROWSER_UA
): Promise<Partial<ProductLinkMeta>> {
  const res = await fetchWithTimeout(rawUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": userAgent,
    },
    redirect: "follow",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Halaman tidak bisa dibuka (${res.status})`);
  }
  const html = await res.text();
  return parseHtmlMeta(html, res.url || rawUrl);
}

function hasUsefulMeta(meta: Partial<ProductLinkMeta> | null | undefined): boolean {
  if (!meta) return false;
  return Boolean(meta.title || meta.description || meta.imageUrl || meta.price != null);
}

export async function fetchProductLinkMeta(
  rawUrl: string
): Promise<ProductLinkMeta> {
  const trimmed = rawUrl.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("URL tidak valid");
  }
  if (!/^https?:$/i.test(url.protocol)) {
    throw new Error("URL harus http/https");
  }

  const host = url.hostname.toLowerCase();
  const isShopee = host.includes("shopee.");

  let resolvedUrl = trimmed;
  if (isShopee) {
    try {
      resolvedUrl = await resolveRedirectUrl(trimmed);
    } catch {
      resolvedUrl = trimmed;
    }
  }

  const ids = parseShopeeIds(resolvedUrl) || parseShopeeIds(trimmed);

  let shopee: Partial<ProductLinkMeta> | null = null;
  if (ids) {
    try {
      shopee = await fetchShopeeApiMeta(ids.shopId, ids.itemId);
    } catch {
      shopee = null;
    }
  }

  let og: Partial<ProductLinkMeta> = {};

  // Canonical product page usually has OG tags; short/opaanlp pages often do not.
  const candidateUrls: string[] = [];
  if (ids) {
    candidateUrls.push(
      `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`,
      `https://shopee.co.id/a-i.${ids.shopId}.${ids.itemId}`
    );
  }
  if (isShopee) {
    candidateUrls.push(trimmed);
  } else {
    candidateUrls.push(trimmed);
  }

  for (const candidate of candidateUrls) {
    if (hasUsefulMeta(og)) break;
    try {
      const meta = await fetchOpenGraphMeta(candidate, BROWSER_UA);
      if (hasUsefulMeta(meta)) {
        og = meta;
        break;
      }
    } catch {
      // try next
    }
  }

  // Short Shopee links often expose OG only to share bots.
  if (isShopee && !hasUsefulMeta(og)) {
    try {
      const meta = await fetchOpenGraphMeta(trimmed, SHARE_UA);
      if (hasUsefulMeta(meta)) og = meta;
    } catch {
      // ignore
    }
  }

  const title = shopee?.title || og.title || null;
  const description = shopee?.description || og.description || null;
  const imageUrl = shopee?.imageUrl || og.imageUrl || null;
  const price = shopee?.price ?? og.price ?? null;
  const platform =
    shopee?.platform || og.platform || (isShopee ? "Shopee" : null);

  if (!title && !description && !imageUrl && price == null) {
    throw new Error("Gagal");
  }

  return {
    title,
    description,
    imageUrl,
    price,
    platform,
    source: shopee?.imageUrl || shopee?.title ? "shopee-api" : "open-graph",
  };
}
