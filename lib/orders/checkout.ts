import { OrderPayMethod, OrderPayProvider, OrderStatus } from "@prisma/client";
import type { CheckoutBuyer, CheckoutOwner } from "@/lib/orders/types";
import {
  buildOrderDraft,
  clearCartForOrder,
  createPendingOrder,
  makeExternalId,
  ownerOrderWhere,
} from "@/lib/orders/draft";
import { getOrderForOwner } from "@/lib/orders/queries";
import {
  createMidtransQris,
  parseMidtransExpireTime,
} from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { getQrisProvider } from "@/lib/qris-provider";
import { createXenditDynamicQris } from "@/lib/xendit";

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
  if (!order) throw new Error("Order tidak ditemukan");
  if (order.payMethod !== OrderPayMethod.bank_transfer) {
    throw new Error("Bukan order transfer bank");
  }
  if (order.status !== OrderStatus.pending) {
    throw new Error("Order sudah tidak pending");
  }
  if (!account) throw new Error("Rekening tidak valid");

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
