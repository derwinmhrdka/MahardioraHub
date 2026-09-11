"use server";

import { redirect } from "next/navigation";
import { countActiveBankAccounts } from "@/lib/bank-accounts";
import { parseBuyerInput, saveBuyerProfile } from "@/lib/buyer";
import { resolveCartOwner } from "@/lib/cart-owner";
import {
  attachPaymentProof,
  buildCashWhatsAppMessage,
  createBankTransferCheckout,
  createCashCheckout,
  createQrisCheckout,
} from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { qrisConfigured } from "@/lib/qris-provider";
import { saveProductImage } from "@/lib/uploads";

function buyerFromForm(formData: FormData) {
  return parseBuyerInput({
    name: String(formData.get("buyerName") ?? ""),
    whatsapp: String(formData.get("buyerWhatsapp") ?? ""),
    address: String(formData.get("buyerAddress") ?? ""),
  });
}

async function prepareCheckout(formData: FormData) {
  const owner = await resolveCartOwner();
  const buyer = buyerFromForm(formData);
  await saveBuyerProfile({ userId: owner.userId, buyer });
  return { owner, buyer };
}

export async function checkoutQrisAction(formData: FormData) {
  if (!(await qrisConfigured())) {
    throw new Error("QRIS belum dikonfigurasi");
  }
  const { owner, buyer } = await prepareCheckout(formData);
  const order = await createQrisCheckout({ owner, buyer });
  redirect(`/checkout/${order.id}`);
}

export async function checkoutBankTransferAction(formData: FormData) {
  const activeCount = await countActiveBankAccounts();
  if (activeCount < 1) {
    throw new Error("Belum ada rekening bank");
  }
  const { owner, buyer } = await prepareCheckout(formData);
  const order = await createBankTransferCheckout({ owner, buyer });
  redirect(`/checkout/${order.id}`);
}

export async function submitBankTransferProofAction(formData: FormData) {
  const owner = await resolveCartOwner();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const bankAccountId = Number(formData.get("bankAccountId"));
  if (!orderId || !Number.isFinite(bankAccountId)) {
    return { error: "Data tidak lengkap" };
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size <= 0) {
    return { error: "Upload bukti transfer" };
  }

  try {
    const proofUrl = await saveProductImage(file);
    const order = await attachPaymentProof({
      orderId,
      owner,
      bankAccountId,
      paymentProofUrl: proofUrl,
    });
    if (!order) return { error: "Order tidak ditemukan" };
    return { proofUrl: order.paymentProofUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal upload";
    return { error: message };
  }
}

export async function checkoutCashAction(formData: FormData) {
  const { owner, buyer } = await prepareCheckout(formData);
  const [order, settings] = await Promise.all([
    createCashCheckout({ owner, buyer }),
    getSettings(),
  ]);

  const text = buildCashWhatsAppMessage({
    template: settings.whatsappTemplate,
    order: {
      id: order.id,
      externalId: order.externalId,
      amount: order.amount,
      buyerName: order.buyerName,
      buyerWhatsapp: order.buyerWhatsapp,
      buyerAddress: order.buyerAddress,
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
