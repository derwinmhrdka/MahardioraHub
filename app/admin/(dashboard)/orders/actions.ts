"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  acceptOrder,
  confirmBankTransferPayment,
  rejectOrder,
  rejectPendingBankTransfer,
} from "@/lib/orders";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/login?next=/admin/orders");
  }
  return session;
}

export async function acceptOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) redirect("/admin/orders");

  await acceptOrder(orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect("/admin/orders?tab=completed&accepted=1");
}

export async function confirmBankTransferAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) redirect("/admin/orders?tab=pending");

  const order = await confirmBankTransferPayment(orderId);
  if (!order || order.status !== "paid") {
    redirect(`/admin/orders?tab=pending&confirmError=1&order=${orderId}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect("/admin/orders?tab=progress&confirmed=1");
}

export async function rejectOrderAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!orderId) redirect("/admin/orders");
  if (!reason)
    redirect(`/admin/orders?tab=progress&rejectError=1&order=${orderId}`);

  await rejectOrder(orderId, reason);
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect("/admin/orders?tab=cancel&rejected=1");
}

export async function rejectPendingBankTransferAction(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!orderId) redirect("/admin/orders?tab=pending");
  if (!reason)
    redirect(`/admin/orders?tab=pending&rejectError=1&order=${orderId}`);

  await rejectPendingBankTransfer(orderId, reason);
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  redirect("/admin/orders?tab=cancel&rejected=1");
}
