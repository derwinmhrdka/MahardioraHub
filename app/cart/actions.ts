"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  removeFromCart,
  setAllCartSelected,
  setCartQuantity,
  setCartSelected,
} from "@/lib/cart";
import { resolveCartOwner } from "@/lib/cart-owner";

function revalidateCartViews(productId?: number) {
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/checkout");
  if (productId != null && Number.isFinite(productId)) {
    revalidatePath(`/secondhand/${productId}`);
  }
}

export async function addToCartAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  if (!Number.isFinite(productId)) {
    throw new Error("Invalid product");
  }

  const qtyRaw = Number(formData.get("quantity"));
  const quantity =
    Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : 1;

  const owner = await resolveCartOwner();
  try {
    await addToCart(owner.ownerKey, productId, quantity);
  } catch {
    return;
  }

  revalidateCartViews(productId);
}

export async function updateCartQtyAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(productId) || !Number.isFinite(quantity)) {
    throw new Error("Invalid");
  }
  const owner = await resolveCartOwner();
  await setCartQuantity(owner.ownerKey, productId, quantity);
  revalidateCartViews(productId);
}

export async function removeCartItemAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  if (!Number.isFinite(productId)) throw new Error("Invalid");
  const owner = await resolveCartOwner();
  await removeFromCart(owner.ownerKey, productId);
  revalidateCartViews(productId);
}

export async function toggleCartItemSelectedAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const selected = formData.get("selected") === "1";
  if (!Number.isFinite(productId)) throw new Error("Invalid");
  const owner = await resolveCartOwner();
  await setCartSelected(owner.ownerKey, productId, selected);
  revalidateCartViews(productId);
}

export async function toggleAllCartSelectedAction(formData: FormData) {
  const selected = formData.get("selected") === "1";
  const owner = await resolveCartOwner();
  await setAllCartSelected(owner.ownerKey, selected);
  revalidateCartViews();
}
