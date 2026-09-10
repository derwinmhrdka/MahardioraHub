"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cancelUserOrder } from "@/lib/orders";

export async function cancelOrderAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/orders");

  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) redirect("/orders?tab=pending");

  await cancelUserOrder(orderId, userId);
  revalidatePath("/orders");
  revalidatePath("/checkout");
  redirect("/orders?tab=cancel&cancelled=1");
}
