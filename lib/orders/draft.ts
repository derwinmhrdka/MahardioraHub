import { OrderPayMethod, OrderPayProvider, OrderStatus, Prisma } from "@prisma/client";
import type { CheckoutBuyer, CheckoutOwner } from "@/lib/orders/types";
import { listSelectedCartItems } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { salePrice } from "@/lib/pricing";

export function makeExternalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function buildOrderDraft(ownerKey: string) {
  const rows = await listSelectedCartItems(ownerKey);
  if (rows.length === 0) throw new Error("Pilih item di cart dulu");

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

export async function createPendingOrder(
  owner: CheckoutOwner,
  buyer: CheckoutBuyer,
  payMethod: OrderPayMethod,
  externalId: string,
  draft: Awaited<ReturnType<typeof buildOrderDraft>>,
  payProvider?: OrderPayProvider | null
) {
  return prisma.order.create({
    data: {
      userId: owner.userId,
      guestId: owner.guestId,
      buyerName: buyer.name,
      buyerWhatsapp: buyer.whatsapp,
      buyerAddress: buyer.address,
      branchId: buyer.branchId ?? null,
      shipFromBranch: buyer.shipFromBranch ?? null,
      status: OrderStatus.pending,
      payMethod,
      payProvider: payProvider ?? null,
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

export async function clearCartForOrder(
  ownerKey: string,
  items: Array<{ productId: number }>
) {
  for (const item of items) {
    await prisma.cartItem.deleteMany({
      where: { ownerKey, productId: item.productId },
    });
  }
}

export function ownerOrderWhere(owner: CheckoutOwner): Prisma.OrderWhereInput {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestId) return { guestId: owner.guestId };
  return { id: "__none__" };
}
