import { OrderPayProvider, OrderStatus, Prisma } from "@prisma/client";
import type { CheckoutOwner } from "@/lib/orders/types";
import { getOrderForOwner } from "@/lib/orders/queries";
import { cancelMidtransTransaction } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { cleanupRemovedUploads } from "@/lib/upload-gc";

/**
 * Cancel pending order and invalidate PSP QR when possible.
 */
export async function cancelOwnerOrder(orderId: string, owner: CheckoutOwner) {
  const order = await getOrderForOwner(orderId, owner);
  if (!order) return null;
  if (order.status !== OrderStatus.pending) return order;

  if (order.payProvider === OrderPayProvider.midtrans) {
    try {
      await cancelMidtransTransaction(order.externalId);
    } catch {
      // Still cancel locally if PSP already expired/cancelled
    }
  }

  const proofUrl = order.paymentProofUrl;
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.cancelled,
      qrString: null,
      paymentProofUrl: null,
      paymentProofAt: null,
    },
    include: { items: true, bankAccount: true },
  });
  if (proofUrl) await cleanupRemovedUploads([proofUrl]);
  return updated;
}

/**
 * Mark order paid once: decrement stock + clear matching cart lines.
 * Idempotent.
 */
export async function markOrderPaid(input: {
  externalId?: string | null;
  pspId?: string | null;
  orderId?: string | null;
}) {
  const filters: Prisma.OrderWhereInput[] = [];
  if (input.externalId) filters.push({ externalId: input.externalId });
  if (input.pspId) filters.push({ pspId: input.pspId });
  if (input.orderId) filters.push({ id: input.orderId });
  if (filters.length === 0) return null;

  const order = await prisma.order.findFirst({
    where: { OR: filters },
    include: { items: true },
  });

  if (!order) return null;
  if (
    order.status === OrderStatus.paid ||
    order.status === OrderStatus.completed
  ) {
    return order;
  }
  if (
    order.status === OrderStatus.cancelled ||
    order.status === OrderStatus.expired ||
    order.status === OrderStatus.failed
  ) {
    return order;
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: order.id } });
    if (
      !current ||
      current.status === OrderStatus.paid ||
      current.status === OrderStatus.completed
    ) {
      return current;
    }
    if (
      current.status === OrderStatus.cancelled ||
      current.status === OrderStatus.expired ||
      current.status === OrderStatus.failed
    ) {
      return current;
    }

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
      const ownerKey = updated.userId
        ? `u_${updated.userId}`
        : updated.guestId
          ? `g_${updated.guestId}`
          : null;
      if (ownerKey) {
        await tx.cartItem.deleteMany({
          where: { ownerKey, productId: item.productId },
        });
      }
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

export async function markOrderFailed(externalId: string) {
  return prisma.order.updateMany({
    where: {
      externalId,
      status: OrderStatus.pending,
    },
    data: { status: OrderStatus.failed },
  });
}

export async function markOrderCancelled(externalId: string) {
  return prisma.order.updateMany({
    where: {
      externalId,
      status: OrderStatus.pending,
    },
    data: { status: OrderStatus.cancelled, qrString: null },
  });
}
