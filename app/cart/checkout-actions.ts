"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createInvoiceCheckout, createQrisCheckout } from "@/lib/orders";
import { xenditConfigured } from "@/lib/xendit";

export async function checkoutInvoiceAction() {
  if (!xenditConfigured()) {
    throw new Error("Xendit belum dikonfigurasi");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/secondhand");

  const order = await createInvoiceCheckout({
    userId,
    email: session.user?.email,
    name: session.user?.name,
  });

  if (!order.invoiceUrl) throw new Error("Invoice gagal");
  redirect(order.invoiceUrl);
}

export async function checkoutQrisAction() {
  if (!xenditConfigured()) {
    throw new Error("Xendit belum dikonfigurasi");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/secondhand");

  const order = await createQrisCheckout({ userId });
  redirect(`/checkout/${order.id}`);
}
