import { OrderPayMethod, OrderStatus, Prisma } from "@prisma/client";
import { listCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { salePrice } from "@/lib/pricing";
import {
  createXenditDynamicQris,
  createXenditInvoice,
} from "@/lib/xendit";

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

export async function createInvoiceCheckout(input: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  const draft = await buildOrderDraft(input.userId);
  const externalId = makeExternalId("inv");

  const order = await prisma.order.create({
    data: {
      userId: input.userId,
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.invoice,
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
  });

  try {
    const invoice = await createXenditInvoice({
      externalId,
      amount: draft.amount,
      description: `Order ${order.id.slice(0, 8)} · ${draft.items.length} item`,
      customerEmail: input.email,
      customerName: input.name,
    });

    return prisma.order.update({
      where: { id: order.id },
      data: {
        xenditId: invoice.id,
        invoiceUrl: invoice.invoice_url,
        expiresAt: invoice.expiry_date ? new Date(invoice.expiry_date) : null,
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

export async function createQrisCheckout(input: { userId: string }) {
  const draft = await buildOrderDraft(input.userId);
  const externalId = makeExternalId("qris");

  const order = await prisma.order.create({
    data: {
      userId: input.userId,
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.qris,
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
  });

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
}) {
  const filters: Prisma.OrderWhereInput[] = [];
  if (input.externalId) filters.push({ externalId: input.externalId });
  if (input.xenditId) filters.push({ xenditId: input.xenditId });
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
