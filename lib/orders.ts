import { OrderPayMethod, OrderPayProvider, OrderStatus, Prisma } from "@prisma/client";
import type { BuyerInput } from "@/lib/buyer";
import { listSelectedCartItems } from "@/lib/cart";
import {
  cancelMidtransTransaction,
  createMidtransQris,
  parseMidtransExpireTime,
} from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { salePrice } from "@/lib/pricing";
import { getQrisProvider } from "@/lib/qris-provider";
import { createXenditDynamicQris } from "@/lib/xendit";
import { orderPageUrl } from "@/lib/settings";
import { cleanupRemovedUploads } from "@/lib/upload-gc";

export type CheckoutBuyer = BuyerInput;

export type CheckoutOwner = {
  ownerKey: string;
  userId: string | null;
  guestId: string | null;
};

function makeExternalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function buildOrderDraft(ownerKey: string) {
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

async function createPendingOrder(
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

async function clearCartForOrder(
  ownerKey: string,
  items: Array<{ productId: number }>
) {
  for (const item of items) {
    await prisma.cartItem.deleteMany({
      where: { ownerKey, productId: item.productId },
    });
  }
}

function ownerOrderWhere(owner: CheckoutOwner): Prisma.OrderWhereInput {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestId) return { guestId: owner.guestId };
  return { id: "__none__" };
}

/** Pending QRIS that is still within expiresAt (auto-expire if past). */
export async function getActivePendingQrisOrder(owner: CheckoutOwner) {
  const order = await prisma.order.findFirst({
    where: {
      ...ownerOrderWhere(owner),
      payMethod: OrderPayMethod.qris,
      status: OrderStatus.pending,
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  if (!order) return null;

  if (order.expiresAt && order.expiresAt.getTime() <= Date.now()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.expired },
    });
    return null;
  }

  if (!order.qrString) return null;
  return order;
}

/**
 * Reuse active pending QRIS if any; otherwise create new QR from cart.
 * Returning to payment must not mint a second QR.
 */
/** QRIS via Midtrans or Xendit. Cart cleared after QR siap. */
export async function createQrisCheckout(input: {
  owner: CheckoutOwner;
  buyer: CheckoutBuyer;
}) {
  const draft = await buildOrderDraft(input.owner.ownerKey);
  const externalId = makeExternalId("qris");
  const provider = await getQrisProvider();
  const payProvider =
    provider === "xendit"
      ? OrderPayProvider.xendit
      : OrderPayProvider.midtrans;

  const order = await createPendingOrder(
    input.owner,
    input.buyer,
    OrderPayMethod.qris,
    externalId,
    draft,
    payProvider
  );

  try {
    if (provider === "midtrans") {
      const qr = await createMidtransQris({
        orderId: externalId,
        amount: draft.amount,
      });
      if (!qr.qr_string) {
        throw new Error("Midtrans QR string missing");
      }
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          pspId: qr.transaction_id,
          qrString: qr.qr_string,
          expiresAt: parseMidtransExpireTime(qr.expire_time),
        },
        include: { items: true },
      });
      await clearCartForOrder(input.owner.ownerKey, updated.items);
      return updated;
    }

    const qr = await createXenditDynamicQris({
      externalId,
      amount: draft.amount,
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        pspId: qr.id,
        qrString: qr.qr_string,
        expiresAt: qr.expires_at ? new Date(qr.expires_at) : null,
      },
      include: { items: true },
    });
    await clearCartForOrder(input.owner.ownerKey, updated.items);
    return updated;
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.failed },
    });
    throw err;
  }
}

/** Cash: local invoice + WA chat. Cart cleared; stock on paid. */
export async function createCashCheckout(input: {
  owner: CheckoutOwner;
  buyer: CheckoutBuyer;
}) {
  const draft = await buildOrderDraft(input.owner.ownerKey);
  const externalId = makeExternalId("cash");
  const order = await createPendingOrder(
    input.owner,
    input.buyer,
    OrderPayMethod.cash,
    externalId,
    draft
  );
  await clearCartForOrder(input.owner.ownerKey, order.items);
  return order;
}

const BANK_TRANSFER_TTL_MS = 24 * 60 * 60 * 1000;

/** Pending bank transfer still within expiresAt. */
export async function getActivePendingBankTransferOrder(owner: CheckoutOwner) {
  const order = await prisma.order.findFirst({
    where: {
      ...ownerOrderWhere(owner),
      payMethod: OrderPayMethod.bank_transfer,
      status: OrderStatus.pending,
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      bankAccount: true,
    },
  });
  if (!order) return null;

  if (order.expiresAt && order.expiresAt.getTime() <= Date.now()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.cancelled },
    });
    return null;
  }

  return order;
}

/**
 * Create bank transfer order from selected cart items.
 * Cart cleared on create; admin marks paid after reviewing proof.
 * Allows multiple pending orders (new checkout tidak reuse pending lama).
 */
export async function createBankTransferCheckout(input: {
  owner: CheckoutOwner;
  buyer: CheckoutBuyer;
}) {
  const draft = await buildOrderDraft(input.owner.ownerKey);
  const externalId = makeExternalId("tf");
  const order = await createPendingOrder(
    input.owner,
    input.buyer,
    OrderPayMethod.bank_transfer,
    externalId,
    draft
  );

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      expiresAt: new Date(Date.now() + BANK_TRANSFER_TTL_MS),
    },
    include: {
      items: true,
      bankAccount: true,
    },
  });

  await clearCartForOrder(input.owner.ownerKey, updated.items);
  return updated;
}

export async function selectOrderBankAccount(input: {
  orderId: string;
  owner: CheckoutOwner;
  bankAccountId: number;
}) {
  const [order, account] = await Promise.all([
    getOrderForOwner(input.orderId, input.owner),
    prisma.bankAccount.findFirst({
      where: { id: input.bankAccountId, isActive: true },
    }),
  ]);
  if (!order || order.payMethod !== OrderPayMethod.bank_transfer) return null;
  if (order.status !== OrderStatus.pending) return order;
  if (!account) return null;

  return prisma.order.update({
    where: { id: order.id },
    data: { bankAccountId: account.id },
    include: {
      items: true,
      bankAccount: true,
    },
  });
}

export async function attachPaymentProof(input: {
  orderId: string;
  owner: CheckoutOwner;
  bankAccountId: number;
  paymentProofUrl: string;
}) {
  const [order, account] = await Promise.all([
    getOrderForOwner(input.orderId, input.owner),
    prisma.bankAccount.findFirst({
      where: { id: input.bankAccountId, isActive: true },
    }),
  ]);
  if (!order || order.payMethod !== OrderPayMethod.bank_transfer) return null;
  if (order.status !== OrderStatus.pending) return order;
  if (!account) return null;

  return prisma.order.update({
    where: { id: order.id },
    data: {
      bankAccountId: account.id,
      paymentProofUrl: input.paymentProofUrl,
      paymentProofAt: new Date(),
    },
    include: {
      items: true,
      bankAccount: true,
    },
  });
}

/** Admin: pending bank transfer → paid after proof review. */
export async function confirmBankTransferPayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.payMethod !== OrderPayMethod.bank_transfer) return order;
  if (order.status !== OrderStatus.pending) return order;
  if (!order.paymentProofUrl) return order;

  return markOrderPaid({ orderId: order.id });
}

export function buildCashWhatsAppMessage(input: {
  template: string;
  order: {
    id: string;
    externalId: string;
    amount: number;
    buyerName?: string;
    buyerWhatsapp?: string;
    buyerAddress?: string;
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
  const orderLink = orderPageUrl(input.order.id);
  const lines = input.order.items.map((item, i) => {
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}`;
  });
  return [
    intro,
    "",
    `Invoice : ${invoiceNo}`,
    `Bayar : Cash (Via WhatsApp)`,
    `Pesanan : ${orderLink}`,
    input.order.buyerName ? `Nama : ${input.order.buyerName}` : null,
    input.order.buyerWhatsapp ? `WA : ${input.order.buyerWhatsapp}` : null,
    input.order.buyerAddress ? `Alamat : ${input.order.buyerAddress}` : null,
    "",
    "Item :",
    ...lines,
    "",
    `Total : Rp ${input.order.amount.toLocaleString("id-ID")}`,
  ]
    .filter((line): line is string => line != null)
    .join("\n");
}

/** After QRIS paid — confirm order to seller via WA. */
export function buildQrisPaidWhatsAppMessage(input: {
  order: {
    id: string;
    externalId: string;
    amount: number;
    buyerName?: string;
    buyerWhatsapp?: string;
    buyerAddress?: string;
    items: Array<{
      productId: number;
      title: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}): string {
  const invoiceNo = input.order.externalId;
  const orderLink = orderPageUrl(input.order.id);
  const lines = input.order.items.map((item, i) => {
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}`;
  });
  return [
    "Halo, saya sudah bayar via QRIS.",
    "",
    `Invoice : ${invoiceNo}`,
    `Bayar : QRIS`,
    `Status : Paid`,
    `Pesanan : ${orderLink}`,
    input.order.buyerName ? `Nama : ${input.order.buyerName}` : null,
    input.order.buyerWhatsapp ? `WA : ${input.order.buyerWhatsapp}` : null,
    input.order.buyerAddress ? `Alamat : ${input.order.buyerAddress}` : null,
    "",
    "Item :",
    ...lines,
    "",
    `Total : Rp ${input.order.amount.toLocaleString("id-ID")}`,
  ]
    .filter((line): line is string => line != null)
    .join("\n");
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

export type OrderListTab = "pending" | "progress" | "completed" | "cancel";

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

/** @deprecated use listOrdersForOwner */
export async function listOrdersForUser(userId: string, tab: OrderListTab) {
  return listOrdersForOwner(
    { ownerKey: `u_${userId}`, userId, guestId: null },
    tab
  );
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

export async function countPendingOrders(userId: string) {
  return countPendingOrdersForOwner({
    ownerKey: `u_${userId}`,
    userId,
    guestId: null,
  });
}

export async function countProgressOrders(userId: string) {
  return countProgressOrdersForOwner({
    ownerKey: `u_${userId}`,
    userId,
    guestId: null,
  });
}

const adminOrderInclude = {
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

export async function getOrderForAdmin(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: adminOrderInclude,
  });
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

/** Past expiresAt → cancel QR + move to cancelled (Cancel tab). */
async function expireOverdueQrisOrders(owner: CheckoutOwner) {
  const overdue = await prisma.order.findMany({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.qris,
      expiresAt: { lte: new Date() },
    },
  });

  for (const order of overdue) {
    if (order.payProvider === OrderPayProvider.midtrans) {
      try {
        await cancelMidtransTransaction(order.externalId);
      } catch {
        // ignore
      }
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.cancelled, qrString: null },
    });
  }
}

async function expireOverdueBankTransferOrders(owner: CheckoutOwner) {
  const overdue = await prisma.order.findMany({
    where: {
      ...ownerOrderWhere(owner),
      status: OrderStatus.pending,
      payMethod: OrderPayMethod.bank_transfer,
      expiresAt: { lte: new Date() },
    },
    select: { id: true, paymentProofUrl: true },
  });

  if (overdue.length === 0) return;

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

/** @deprecated use cancelOwnerOrder */
export async function cancelUserOrder(orderId: string, userId: string) {
  return cancelOwnerOrder(orderId, {
    ownerKey: `u_${userId}`,
    userId,
    guestId: null,
  });
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
