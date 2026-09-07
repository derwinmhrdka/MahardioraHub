export type Marketplace =
  | "shopee"
  | "tokopedia"
  | "tiktok"
  | "lazada"
  | "other";

export function detectMarketplace(input: {
  shopName?: string | null;
  url?: string | null;
}): Marketplace {
  const hay = `${input.shopName ?? ""} ${input.url ?? ""}`.toLowerCase();

  if (
    hay.includes("shopee") ||
    hay.includes("s.shopee") ||
    hay.includes("shp.ee")
  ) {
    return "shopee";
  }
  if (
    hay.includes("tokopedia") ||
    hay.includes("tokped") ||
    hay.includes("tokopedia.link")
  ) {
    return "tokopedia";
  }
  if (hay.includes("tiktok")) {
    return "tiktok";
  }
  if (hay.includes("lazada")) {
    return "lazada";
  }
  return "other";
}
