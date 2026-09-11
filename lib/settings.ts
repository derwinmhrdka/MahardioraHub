import { OrderPayProvider } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  normalizeBannerHidden,
  normalizeBannerImages,
  visibleBannerImages,
} from "./collection-banner";
import { CACHE_TAGS } from "./cache-tags";
import { prisma } from "./prisma";

export type SettingInput = {
  whatsappNumber: string;
  whatsappTemplate: string;
  siteName: string;
  contactEmail?: string | null;
  shopeeAffiliateId?: string | null;
  qrisProvider?: OrderPayProvider;
  branchesEnabled?: boolean;
  collectionBannerActive?: boolean;
  collectionBannerImages?: string[];
  collectionBannerHidden?: string[];
};

export {
  COLLECTION_BANNER_MAX,
  COLLECTION_BANNER_RATIO,
  COLLECTION_BANNER_SIZE_HINT,
} from "./collection-banner";

const DEFAULT_WA_TEMPLATE = "Halo, saya tertarik dengan produk ini.";

async function loadSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) {
    throw new Error("Settings row missing. Run migrations and seed.");
  }
  return settings;
}

/** Cached settings row (busted via `revalidateTag("settings")`). */
export async function getSettings() {
  return unstable_cache(loadSettings, ["settings-row"], {
    tags: [CACHE_TAGS.settings],
    revalidate: 300,
  })();
}

export async function updateSettings(input: SettingInput) {
  const qrisProvider = input.qrisProvider ?? OrderPayProvider.midtrans;
  const bannerActive = input.collectionBannerActive;
  const bannerImages =
    input.collectionBannerImages !== undefined
      ? normalizeBannerImages(input.collectionBannerImages)
      : undefined;
  const bannerHidden =
    input.collectionBannerHidden !== undefined
      ? normalizeBannerHidden(
          input.collectionBannerHidden,
          bannerImages ??
            (await getSettings()).collectionBannerImages ??
            []
        )
      : undefined;

  return prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      whatsappNumber: input.whatsappNumber,
      whatsappTemplate: input.whatsappTemplate || DEFAULT_WA_TEMPLATE,
      siteName: input.siteName,
      contactEmail: input.contactEmail || null,
      shopeeAffiliateId: input.shopeeAffiliateId || null,
      qrisProvider,
      branchesEnabled: input.branchesEnabled ?? true,
      collectionBannerActive: bannerActive ?? false,
      collectionBannerImages: bannerImages ?? [],
      collectionBannerHidden: bannerHidden ?? [],
    },
    update: {
      whatsappNumber: input.whatsappNumber,
      whatsappTemplate: input.whatsappTemplate || DEFAULT_WA_TEMPLATE,
      siteName: input.siteName,
      contactEmail: input.contactEmail || null,
      shopeeAffiliateId: input.shopeeAffiliateId || null,
      qrisProvider,
      ...(input.branchesEnabled !== undefined
        ? { branchesEnabled: input.branchesEnabled }
        : {}),
      ...(bannerActive !== undefined
        ? { collectionBannerActive: bannerActive }
        : {}),
      ...(bannerImages !== undefined
        ? { collectionBannerImages: bannerImages }
        : {}),
      ...(bannerHidden !== undefined
        ? { collectionBannerHidden: bannerHidden }
        : {}),
    },
  });
}

/** Visible Collection promo slides for the public page. */
export async function getCollectionBanner(): Promise<string[]> {
  const settings = await getSettings();
  return visibleBannerImages(
    settings.collectionBannerImages,
    settings.collectionBannerHidden ?? []
  );
}

const DEFAULT_SITE_ORIGIN = "https://mahardiora-hub.teknodika.com";

export function siteOrigin(): string {
  const raw = (
    process.env.DOMAIN ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  ).trim();
  if (!raw) return DEFAULT_SITE_ORIGIN;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

export function productPageUrl(kind: "deal" | "secondhand", id: number): string {
  const path =
    kind === "deal" ? `/deals/product/${id}` : `/secondhand/${id}`;
  return `${siteOrigin()}${path}`;
}

export function orderPageUrl(orderId: string): string {
  return `${siteOrigin()}/orders/${orderId}`;
}

export function buildWhatsAppMessage(input: {
  template: string;
  productTitle: string;
  productLink: string;
}): string {
  const intro = (input.template || DEFAULT_WA_TEMPLATE).trim();
  return [
    intro,
    `Produk : ${input.productTitle}`,
    `Link : ${input.productLink}`,
  ].join("\n");
}

export function buildWhatsAppLink(
  whatsappNumber: string,
  input: {
    template: string;
    productTitle: string;
    productLink: string;
  }
): string {
  const text = encodeURIComponent(buildWhatsAppMessage(input));
  return `https://wa.me/${whatsappNumber}?text=${text}`;
}
