"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addToCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/cart";

async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    redirect("/login?next=/secondhand");
  }
  return id;
}

export async function addToCartAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  const productId = Number(formData.get("productId"));
  const next = String(formData.get("next") ?? "").trim();
  const returnTo =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : Number.isFinite(productId)
        ? `/secondhand/${productId}`
        : "/secondhand";

  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  if (!Number.isFinite(productId)) {
    throw new Error("Invalid product");
  }

  try {
    await addToCart(userId, productId, 1);
  } catch {
    redirect(returnTo);
  }
  revalidatePath("/secondhand");
  redirect(returnTo);
}

export async function updateCartQtyAction(formData: FormData) {
  const userId = await requireUserId();
  const productId = Number(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(productId) || !Number.isFinite(quantity)) {
    throw new Error("Invalid");
  }
  await setCartQuantity(userId, productId, quantity);
  revalidatePath("/secondhand");
}

export async function removeCartItemAction(formData: FormData) {
  const userId = await requireUserId();
  const productId = Number(formData.get("productId"));
  if (!Number.isFinite(productId)) throw new Error("Invalid");
  await removeFromCart(userId, productId);
  revalidatePath("/secondhand");
}
