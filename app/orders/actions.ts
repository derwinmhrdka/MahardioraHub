"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveCartOwner } from "@/lib/cart-owner";
import { cancelOwnerOrder } from "@/lib/orders";

export async function cancelOrderAction(formData: FormData) {
  const owner = await resolveCartOwner();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) redirect("/orders?tab=pending");

  await cancelOwnerOrder(orderId, owner);
  revalidatePath("/orders");
  revalidatePath("/checkout");
  redirect("/orders?tab=cancel&cancelled=1");
}
