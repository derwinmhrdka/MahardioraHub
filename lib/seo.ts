import type { Metadata } from "next";
import { productImageUrl } from "@/lib/image-url";
import { productNotePreview } from "@/components/ProductNote";
import { siteOrigin } from "@/lib/settings";

export function absoluteUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return siteOrigin();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${siteOrigin()}${path}`;
}

export function absoluteMediaUrl(
  url: string | null | undefined,
  width = 800
): string | null {
  if (!url) return null;
  const resized = productImageUrl(url, width) ?? url.trim();
  if (!resized) return null;
  if (/^https?:\/\//i.test(resized)) return resized;
  return absoluteUrl(resized);
}

type ShareMetaInput = {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  siteName: string;
};

export function buildShareMetadata(input: ShareMetaInput): Metadata {
  const description =
    productNotePreview(input.description) ||
    `${input.siteName} — My Picks & Collection`;
  const image =
    absoluteMediaUrl(input.imageUrl, 800) ?? absoluteUrl("/opengraph-image");
  const images = [
    {
      url: image,
      width: input.imageUrl ? 800 : 1200,
      height: input.imageUrl ? 800 : 630,
      alt: input.title,
    },
  ];

  return {
    title: input.title,
    description,
    alternates: {
      canonical: input.url,
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: input.url,
      siteName: input.siteName,
      title: input.title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [image],
    },
  };
}
