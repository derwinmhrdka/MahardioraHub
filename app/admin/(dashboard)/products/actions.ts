"use server";

import { ProductKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  setProductActive,
  updateProduct,
} from "@/lib/products";

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

export async function deactivateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await setProductActive(id, false);
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}

export async function activateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid product id");
  await setProductActive(id, true);
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/products");
}
