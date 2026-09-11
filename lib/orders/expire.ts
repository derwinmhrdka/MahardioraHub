import { OrderPayMethod, OrderPayProvider, OrderStatus } from "@prisma/client";
import type { CheckoutOwner } from "@/lib/orders/types";
import { ownerOrderWhere } from "@/lib/orders/draft";
import { cancelMidtransTransaction } from "@/lib/midtrans";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { cleanupRemovedUploads } from "@/lib/upload-gc";

/** Past expiresAt → cancel QR + move to cancelled (Cancel tab). */
export async function expireOverdueQrisOrders(owner: CheckoutOwner) {
  const overdue = await prisma.order.findMany({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.qris,
      expiresAt: { lte: new Date() },
    },
  });

  for (const order of overdue) {
    await expireOneQrisOrder(order);
  }
  return overdue.length;
}

async function expireOneQrisOrder(order: {
  id: string;
  externalId: string;
  payProvider: OrderPayProvider | null;
}) {
  if (order.payProvider === OrderPayProvider.midtrans) {
    try {
      await cancelMidtransTransaction(order.externalId);
    } catch {
      // ignore PSP errors; still expire locally
    }
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.cancelled, qrString: null },
  });
}

export async function expireOverdueBankTransferOrders(owner: CheckoutOwner) {
  const overdue = await prisma.order.findMany({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.bank_transfer,
      expiresAt: { lte: new Date() },
    },
    select: { id: true, paymentProofUrl: true },
  });

  if (overdue.length === 0) return 0;
  await finalizeBankTransferExpiry(overdue);
  return overdue.length;
}

async function finalizeBankTransferExpiry(
  overdue: Array<{ id: string; paymentProofUrl: string | null }>
) {
  const proofUrls = overdue
    .map((o) => o.paymentProofUrl)
    .filter((url): url is string => Boolean(url));

  await prisma.order.updateMany({
    where: { id: { in: overdue.map((o) => o.id) } },
    data: {
      status: OrderStatus.cancelled,
      paymentProofUrl: null,
      paymentProofAt: null,
    },
  });

  if (proofUrls.length > 0) await cleanupRemovedUploads(proofUrls);
}

/**
 * Global sweep for cron / background scheduler (all owners).
 */
export async function expireAllOverdueOrders() {
  const now = new Date();

  const overdueQris = await prisma.order.findMany({
    where: {
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.qris,
      expiresAt: { lte: now },
    },
    select: { id: true, externalId: true, payProvider: true },
  });

  for (const order of overdueQris) {
    await expireOneQrisOrder(order);
  }

  const overdueBank = await prisma.order.findMany({
    where: {
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.bank_transfer,
      expiresAt: { lte: now },
    },
    select: { id: true, paymentProofUrl: true },
  });

  if (overdueBank.length > 0) {
    await finalizeBankTransferExpiry(overdueBank);
  }

  const result = {
    qrisExpired: overdueQris.length,
    bankExpired: overdueBank.length,
  };

  if (result.qrisExpired > 0 || result.bankExpired > 0) {
    log.info("orders.expired", result);
  }

  return result;
}
