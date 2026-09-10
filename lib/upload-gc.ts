import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";
import {
  deleteUploadsIfUnreferenced,
  normalizeLocalUploadUrl,
  purgeOrphanUploads,
} from "@/lib/uploads";

/** All `/uploads/...` paths currently stored on products + settings. */
export async function getReferencedLocalUploadUrls(): Promise<Set<string>> {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      select: { imageUrl: true, imageUrls: true },
    }),
    prisma.setting.findUnique({
      where: { id: 1 },
      select: { collectionBannerImages: true },
    }),
  ]);

  const referenced = new Set<string>();
  for (const product of products) {
    for (const url of productImages(product)) {
      const normalized = normalizeLocalUploadUrl(url);
      if (normalized) referenced.add(normalized);
    }
  }
  for (const url of settings?.collectionBannerImages ?? []) {
    const normalized = normalizeLocalUploadUrl(url);
    if (normalized) referenced.add(normalized);
  }
  return referenced;
}

export async function cleanupRemovedUploads(removedUrls: string[]) {
  if (removedUrls.length === 0) return;
  const referenced = await getReferencedLocalUploadUrls();
  await deleteUploadsIfUnreferenced(removedUrls, referenced);
}

export async function cleanupProductUploadsAndOrphans(candidateUrls: string[]) {
  const referenced = await getReferencedLocalUploadUrls();
  await deleteUploadsIfUnreferenced(candidateUrls, referenced);
  await purgeOrphanUploads(referenced);
}
