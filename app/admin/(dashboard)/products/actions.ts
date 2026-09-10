"use server";

import { ProductKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  deleteProduct,
  importProductsFromCsvRows,
  setProductActive,
  updateProduct,
} from "@/lib/products";
import { parseProductCsv } from "@/lib/products-csv";
import { fetchProductLinkMeta } from "@/lib/link-meta";
import { findOrCreateCategoryByName } from "@/lib/categories";
import { parseImageUrlsField } from "@/lib/product-images";
import { clampDiscountPercent } from "@/lib/pricing";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_UPLOAD_COUNT,
  saveProductImage,
} from "@/lib/uploads";
import { cleanupRemovedUploads } from "@/lib/upload-gc";

async function parseProductForm(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as ProductKind;
  const title = String(formData.get("title") ?? "").trim();
  const newCategoryName = String(formData.get("newCategoryName") ?? "").trim();
  let categoryId = Number(formData.get("categoryId"));
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? 0 : Number(priceRaw);
  const discountRaw = String(formData.get("discountPercent") ?? "").trim();
  const discountPercent =
    discountRaw === "" ? 0 : Number(discountRaw);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageUrls = parseImageUrlsField(
    String(formData.get("imageUrls") ?? imageUrl)
  );
  const shortNote = String(formData.get("shortNote") ?? "").trim();
  const storeArea = String(formData.get("storeArea") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const affiliateLink = String(formData.get("affiliateLink") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock =
    stockRaw === "" ? 1 : Math.max(0, Math.round(Number(stockRaw)));

  if (newCategoryName) {
    const category = await findOrCreateCategoryByName(newCategoryName);
    categoryId = category.id;
  }

  if (
    (kind !== ProductKind.deal && kind !== ProductKind.secondhand) ||
    !title ||
    !Number.isFinite(categoryId) ||
    !Number.isFinite(price) ||
    !Number.isFinite(stock)
  ) {
    throw new Error("Invalid product form");
  }

  if (kind === ProductKind.deal && !affiliateLink) {
    throw new Error("Link required for deal");
  }

  return {
    kind,
    title,
    categoryId,
    price: Math.round(price),
    discountPercent:
      kind === ProductKind.secondhand
        ? clampDiscountPercent(discountPercent)
        : 0,
    stock: kind === ProductKind.secondhand ? stock : 0,
    imageUrl: imageUrls[0] ?? (imageUrl || null),
    imageUrls,
    shortNote: shortNote || null,
    storeArea: storeArea || null,
    shopName: kind === ProductKind.deal ? shopName || null : null,
    affiliateLink: kind === ProductKind.deal ? affiliateLink || null : null,
    isActive,
  };
}

export async function createProductAction(formData: FormData) {
  const data = await parseProductForm(formData);
  await createProduct(data);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  const data = await parseProductForm(formData);
  await updateProduct(id, data);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath(`/deals/product/${id}`);
  revalidatePath(`/secondhand/${id}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function hideProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await setProductActive(id, false);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function showProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await setProductActive(id, true);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await deleteProduct(id);
  revalidatePath("/");
  revalidatePath("/picks");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function importProductsCsvAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/products?importError=empty");
  }

  const text = await file.text();
  const parsed = parseProductCsv(text);
  if (parsed.rows.length === 0 && parsed.errors.length > 0) {
    redirect(
      `/admin/products?importError=${encodeURIComponent(parsed.errors[0])}`
    );
  }

  const result = await importProductsFromCsvRows(parsed.rows);
  const allErrors = [...parsed.errors, ...result.errors];
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");

  const params = new URLSearchParams();
  params.set("imported", String(result.created));
  if (allErrors.length > 0) {
    params.set("failed", String(allErrors.length));
  }
  redirect(`/admin/products?${params.toString()}`);
}

export async function fetchProductLinkMetaAction(url: string) {
  return fetchProductLinkMeta(url);
}

export async function uploadProductImagesAction(formData: FormData) {
  await requireAdmin();

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    throw new Error("Pilih file");
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    throw new Error(`Max ${MAX_UPLOAD_COUNT} file`);
  }

  const urls: string[] = [];
  for (const file of files) {
    urls.push(await saveProductImage(file));
  }
  return { urls };
}

export async function deleteUploadedImageAction(url: string) {
  await requireAdmin();
  const trimmed = url.trim();
  if (!trimmed) return { deleted: false };

  // Detach from Collection banner first so GC can unlink the file.
  const settings = await prisma.setting.findUnique({
    where: { id: 1 },
    select: {
      collectionBannerImages: true,
      collectionBannerHidden: true,
    },
  });
  const bannerUrls = settings?.collectionBannerImages ?? [];
  if (bannerUrls.includes(trimmed)) {
    const next = bannerUrls.filter((item) => item !== trimmed);
    const hidden = (settings?.collectionBannerHidden ?? []).filter(
      (item) => item !== trimmed
    );
    await prisma.setting.update({
      where: { id: 1 },
      data: {
        collectionBannerImages: next,
        collectionBannerHidden: hidden,
        collectionBannerActive: next.length > 0 && next.some((u) => !hidden.includes(u)),
      },
    });
    revalidatePath("/secondhand");
    revalidatePath("/");
    revalidatePath("/admin/settings");
  }

  await cleanupRemovedUploads([trimmed]);
  return { deleted: true };
}
