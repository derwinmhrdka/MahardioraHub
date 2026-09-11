import { OrderPayMethod, OrderStatus, Prisma } from "@prisma/client";
import type { CheckoutOwner, OrderListTab } from "@/lib/orders/types";
import { ownerOrderWhere } from "@/lib/orders/draft";
import {
  expireOverdueBankTransferOrders,
  expireOverdueQrisOrders,
} from "@/lib/orders/expire";
import { prisma } from "@/lib/prisma";

export async function getOrderByExternalId(externalId: string) {
  return prisma.order.findUnique({
    where: { externalId },
    include: { items: true },
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      bankAccount: true,
    },
  });
}

export async function getOrderForOwner(orderId: string, owner: CheckoutOwner) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      bankAccount: true,
    },
  });
  if (!order) return null;

  if (owner.userId && order.userId === owner.userId) return order;
  if (owner.guestId && order.guestId === owner.guestId) return order;

  // Logged-in user may open a guest order from the same browser session.
  if (owner.userId && owner.guestId && order.guestId === owner.guestId) {
    return order;
  }

  return null;
}

/** Buyer owns the order, guest cookie matches, or admin may open any order. */
export async function getOrderForViewer(
  orderId: string,
  input: {
    userId?: string | null;
    guestId?: string | null;
    isAdmin: boolean;
  }
) {
  if (input.isAdmin) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        bankAccount: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  if (input.userId) {
    const byUser = await getOrderForUser(orderId, input.userId);
    if (byUser) return byUser;
  }

  if (input.guestId) {
    return prisma.order.findFirst({
      where: { id: orderId, guestId: input.guestId },
      include: {
        items: true,
        bankAccount: true,
      },
    });
  }

  return null;
}

function statusesForTab(tab: OrderListTab): OrderStatus[] {
  if (tab === "pending") return [OrderStatus.pending];
  if (tab === "progress") return [OrderStatus.paid];
  if (tab === "completed") return [OrderStatus.completed];
  return [OrderStatus.cancelled, OrderStatus.expired, OrderStatus.failed];
}

export async function listOrdersForOwner(owner: CheckoutOwner, tab: OrderListTab) {
  if (tab === "pending") {
    await expireOverdueQrisOrders(owner);
    await expireOverdueBankTransferOrders(owner);
  }

  return prisma.order.findMany({
    where: {
      ...ownerOrderWhere(owner),
      status: { in: statusesForTab(tab) },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function countPendingOrdersForOwner(owner: CheckoutOwner) {
  await expireOverdueQrisOrders(owner);
  await expireOverdueBankTransferOrders(owner);
  return prisma.order.count({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.pending,
    },
  });
}

export async function countProgressOrdersForOwner(owner: CheckoutOwner) {
  return prisma.order.count({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.paid,
    },
  });
}

export const adminOrderInclude = {
  items: true,
  bankAccount: true,
  user: { select: { id: true, name: true, email: true, image: true } },
} satisfies Prisma.OrderInclude;

export async function listOrdersForAdmin(tab: OrderListTab) {
  const where: Prisma.OrderWhereInput =
    tab === "pending"
      ? {
          status: OrderStatus.pending,
          payMethod: OrderPayMethod.bank_transfer,
        }
      : { status: { in: statusesForTab(tab) } };

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: adminOrderInclude,
  });
}

export async function countAdminProgressOrders() {
  return prisma.order.count({
    where: { status: OrderStatus.paid },
  });
}

export async function countAdminPendingBankTransfers() {
  return prisma.order.count({
    where: {
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.bank_transfer,
      paymentProofUrl: { not: null },
    },
  });
}

export async function getOrderForAdmin(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: adminOrderInclude,
  });
}
