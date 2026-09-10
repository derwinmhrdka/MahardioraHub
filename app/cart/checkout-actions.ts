"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  buildCashWhatsAppMessage,
  createCashCheckout,
  createQrisCheckout,
} from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { xenditConfigured } from "@/lib/xendit";

export async function checkoutQrisAction() {
  if (!xenditConfigured()) {
    throw new Error("Xendit belum dikonfigurasi");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/checkout");

  const order = await createQrisCheckout({ userId });
  redirect(`/checkout/${order.id}`);
}

export async function checkoutCashAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/checkout");

  const [order, settings] = await Promise.all([
    createCashCheckout({ userId }),
    getSettings(),
  ]);

  const text = buildCashWhatsAppMessage({
    template: settings.whatsappTemplate,
    order: {
      id: order.id,
      externalId: order.externalId,
      amount: order.amount,
      items: order.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    },
  });

  const wa = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
  redirect(wa);
}
