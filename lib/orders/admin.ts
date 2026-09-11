import { OrderPayMethod, OrderStatus } from "@prisma/client";
import { adminOrderInclude } from "@/lib/orders/queries";
import { markOrderPaid } from "@/lib/orders/paid";
import { prisma } from "@/lib/prisma";
import { cleanupRemovedUploads } from "@/lib/upload-gc";

/** Admin: pending bank transfer + proof → completed in one approval. */
export async function confirmBankTransferPayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.payMethod !== OrderPayMethod.bank_transfer) return order;
  if (order.status !== OrderStatus.pending) return order;
  if (!order.paymentProofUrl) return order;

  const paid = await markOrderPaid({ orderId: order.id });
  if (!paid) return null;
  if (paid.status === OrderStatus.completed) return paid;
  if (paid.status !== OrderStatus.paid) return paid;

  return acceptOrder(paid.id);
}

/** Admin: reject pending bank transfer (restore nothing — stock never decremented). */
export async function rejectPendingBankTransfer(
  orderId: string,
  reason: string
) {
  const cancelReason = reason.trim().slice(0, 500);
  if (!cancelReason) return null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.payMethod !== OrderPayMethod.bank_transfer) return order;
  if (order.status !== OrderStatus.pending) return order;

  const proofUrl = order.paymentProofUrl;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.cancelled,
      cancelReason,
      paymentProofUrl: null,
      paymentProofAt: null,
    },
    include: adminOrderInclude,
  });
  if (proofUrl) await cleanupRemovedUploads([proofUrl]);
  return updated;
}

/** Admin: paid → completed. */
export async function acceptOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== OrderStatus.paid) return order;

  const proofUrl = order.paymentProofUrl;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.completed,
      paymentProofUrl: null,
      paymentProofAt: null,
    },
    include: adminOrderInclude,
  });
  if (proofUrl) await cleanupRemovedUploads([proofUrl]);
  return updated;
}

/** Admin: paid → cancelled + reason; restore stock. */
export async function rejectOrder(orderId: string, reason: string) {
  const cancelReason = reason.trim().slice(0, 500);
  if (!cancelReason) return null;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status !== OrderStatus.paid) return order;

  const proofUrl = order.paymentProofUrl;
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!current || current.status !== OrderStatus.paid) return current;

    for (const item of current.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.cancelled,
        cancelReason,
        qrString: null,
        paymentProofUrl: null,
        paymentProofAt: null,
      },
      include: adminOrderInclude,
    });
  });

  if (proofUrl) await cleanupRemovedUploads([proofUrl]);
  return updated;
}
