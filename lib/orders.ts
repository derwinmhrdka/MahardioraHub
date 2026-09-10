import { OrderPayMethod, OrderStatus, Prisma } from "@prisma/client";
import { listCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { salePrice } from "@/lib/pricing";
import { createXenditDynamicQris } from "@/lib/xendit";
import { productPageUrl } from "@/lib/settings";

function makeExternalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function buildOrderDraft(userId: string) {
  const rows = await listCartItems(userId);
  if (rows.length === 0) throw new Error("Cart kosong");

  const items = rows.map((row) => {
    const unitPrice = salePrice(row.product.price, row.product.discountPercent);
    return {
      productId: row.productId,
      title: row.product.title,
      unitPrice,
      quantity: row.quantity,
      discountPercent: row.product.discountPercent,
      lineTotal: unitPrice * row.quantity,
    };
  });

  const amount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (amount < 1) throw new Error("Total invalid");

  return { items, amount };
}

async function createPendingOrder(
  userId: string,
  payMethod: OrderPayMethod,
  externalId: string,
  draft: Awaited<ReturnType<typeof buildOrderDraft>>
) {
  return prisma.order.create({
    data: {
      userId,
      status: OrderStatus.pending,
      payMethod,
      amount: draft.amount,
      externalId,
      items: {
        create: draft.items.map((item) => ({
          productId: item.productId,
          title: item.title,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discountPercent: item.discountPercent,
        })),
      },
    },
    include: { items: true },
  });
}

async function clearCartForOrder(
  userId: string,
  items: Array<{ productId: number }>
) {
  for (const item of items) {
    await prisma.cartItem.deleteMany({
      where: { userId, productId: item.productId },
    });
  }
}

export async function createQrisCheckout(input: { userId: string }) {
  const draft = await buildOrderDraft(input.userId);
  const externalId = makeExternalId("qris");
  const order = await createPendingOrder(
    input.userId,
    OrderPayMethod.qris,
    externalId,
    draft
  );

  try {
    const qr = await createXenditDynamicQris({
      externalId,
      amount: draft.amount,
    });

    return prisma.order.update({
      where: { id: order.id },
      data: {
        xenditId: qr.id,
        qrString: qr.qr_string,
        expiresAt: qr.expires_at ? new Date(qr.expires_at) : null,
      },
    });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.failed },
    });
    throw err;
  }
}

/** Cash: local invoice + WA chat. Cart cleared; stock on paid. */
export async function createCashCheckout(input: { userId: string }) {
  const draft = await buildOrderDraft(input.userId);
  const externalId = makeExternalId("cash");
  const order = await createPendingOrder(
    input.userId,
    OrderPayMethod.cash,
    externalId,
    draft
  );
  await clearCartForOrder(input.userId, order.items);
  return order;
}

export function buildCashWhatsAppMessage(input: {
  template: string;
  order: {
    id: string;
    externalId: string;
    amount: number;
    items: Array<{
      productId: number;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}): string {
  const intro = input.template.trim();
  const invoiceNo = input.order.externalId;
  const lines = input.order.items.map((item, i) => {
    const link = productPageUrl("secondhand", item.productId);
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}\n   ${link}`;
  });
  return [
    intro,
    "",
    `Invoice : ${invoiceNo}`,
    `Bayar : Cash (Via WhatsApp)`,
    "",
    "Item :",
    ...lines,
    "",
    `Total : Rp ${input.order.amount.toLocaleString("id-ID")}`,
  ].join("\n");
}

/** After QRIS paid — confirm order to seller via WA. */
export function buildQrisPaidWhatsAppMessage(input: {
  order: {
    id: string;
    externalId: string;
    amount: number;
    items: Array<{
      productId: number;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}): string {
  const invoiceNo = input.order.externalId;
  const lines = input.order.items.map((item, i) => {
    const link = productPageUrl("secondhand", item.productId);
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}\n   ${link}`;
  });
  return [
    "Halo, saya sudah bayar via QRIS.",
    "",
    `Invoice : ${invoiceNo}`,
    `Bayar : QRIS`,
    `Status : Paid`,
    "",
    "Item :",
    ...lines,
    "",
    `Total : Rp ${input.order.amount.toLocaleString("id-ID")}`,
  ].join("\n");
}

export async function getOrderByExternalId(externalId: string) {
  return prisma.order.findUnique({
    where: { externalId },
    include: { items: true },
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
}

/**
 * Mark order paid once: decrement stock + clear matching cart lines.
 * Idempotent.
 */
export async function markOrderPaid(input: {
  externalId?: string | null;
  xenditId?: string | null;
  orderId?: string | null;
}) {
  const filters: Prisma.OrderWhereInput[] = [];
  if (input.externalId) filters.push({ externalId: input.externalId });
  if (input.xenditId) filters.push({ xenditId: input.xenditId });
  if (input.orderId) filters.push({ id: input.orderId });
  if (filters.length === 0) return null;

  const order = await prisma.order.findFirst({
    where: { OR: filters },
    include: { items: true },
  });

  if (!order) return null;
  if (order.status === OrderStatus.paid) return order;

  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: order.id } });
    if (!current || current.status === OrderStatus.paid) return current;

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.paid,
        paidAt: new Date(),
      },
      include: { items: true },
    });

    for (const item of updated.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });
      if (product) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, product.stock - item.quantity) },
        });
      }
      await tx.cartItem.deleteMany({
        where: { userId: updated.userId, productId: item.productId },
      });
    }

    return updated;
  });
}

export async function markOrderExpired(externalId: string) {
  return prisma.order.updateMany({
    where: {
      externalId,
      status: OrderStatus.pending,
    },
    data: { status: OrderStatus.expired },
  });
}
