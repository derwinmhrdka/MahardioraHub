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

function parseProductForm(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as ProductKind;
  const title = String(formData.get("title") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const price = Number(formData.get("price"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const shortNote = String(formData.get("shortNote") ?? "").trim();
  const storeArea = String(formData.get("storeArea") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const affiliateLink = String(formData.get("affiliateLink") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (
    (kind !== ProductKind.deal && kind !== ProductKind.secondhand) ||
    !title ||
    !Number.isFinite(categoryId) ||
    !Number.isFinite(price)
  ) {
    throw new Error("Invalid product form");
  }

  return {
    kind,
    title,
    categoryId,
    price: Math.round(price),
    imageUrl: imageUrl || null,
    shortNote: shortNote || null,
    storeArea: storeArea || null,
    shopName: kind === ProductKind.deal ? shopName || null : null,
    affiliateLink: kind === ProductKind.deal ? affiliateLink || null : null,
    isActive,
  };
}

export async function createProductAction(formData: FormData) {
  const data = parseProductForm(formData);
  await createProduct(data);
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  const data = parseProductForm(formData);
  await updateProduct(id, data);
  revalidatePath("/");
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
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function showProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await setProductActive(id, true);
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await deleteProduct(id);
  revalidatePath("/");
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
