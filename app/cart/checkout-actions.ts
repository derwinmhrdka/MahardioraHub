"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { countActiveBankAccounts } from "@/lib/bank-accounts";
import { resolveCheckoutBranch } from "@/lib/branches";
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
  const buyerBase = buyerFromForm(formData);
  const branch = await resolveCheckoutBranch(formData.get("branchId"));
  await saveBuyerProfile({ userId: owner.userId, buyer: buyerBase });
  return {
    owner,
    buyer: {
      ...buyerBase,
      branchId: branch?.branchId ?? null,
      shipFromBranch: branch?.shipFromBranch ?? null,
    },
  };
}

function revalidateAfterCheckout() {
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/checkout");
  revalidatePath("/orders");
}

export async function checkoutQrisAction(formData: FormData) {
  if (!(await qrisConfigured())) {
    throw new Error("QRIS belum dikonfigurasi");
  }
  const { owner, buyer } = await prepareCheckout(formData);
  if (!owner.userId) {
    throw new Error("Login diperlukan untuk QRIS");
  }
  const order = await createQrisCheckout({ owner, buyer });
  revalidateAfterCheckout();
  redirect(`/checkout/${order.id}`);
}

export async function checkoutBankTransferAction(formData: FormData) {
  const activeCount = await countActiveBankAccounts();
  if (activeCount < 1) {
    throw new Error("Belum ada rekening bank");
  }
  const { owner, buyer } = await prepareCheckout(formData);
  if (!owner.userId) {
    throw new Error("Login diperlukan untuk transfer bank");
  }
  const order = await createBankTransferCheckout({ owner, buyer });
  revalidateAfterCheckout();
  redirect(`/checkout/${order.id}`);
}

function asUploadFile(entry: FormDataEntryValue | null): File | Blob | null {
  if (!entry || typeof entry === "string") return null;
  const blob = entry as Blob;
  if (
    typeof blob.size === "number" &&
    blob.size > 0 &&
    typeof blob.arrayBuffer === "function"
  ) {
    return blob;
  }
  return null;
}

export async function submitBankTransferProofAction(formData: FormData) {
  try {
    const owner = await resolveCartOwner();
    const orderId = String(formData.get("orderId") ?? "").trim();
    const bankAccountId = Number(formData.get("bankAccountId"));
    if (!orderId || !Number.isFinite(bankAccountId)) {
      return { error: "Data tidak lengkap" };
    }

    const file = asUploadFile(formData.get("proof"));
    if (!file) {
      return { error: "Upload bukti transfer" };
    }

    const proofUrl = await saveProductImage(file);
    const order = await attachPaymentProof({
      orderId,
      owner,
      bankAccountId,
      paymentProofUrl: proofUrl,
    });
    if (!order.paymentProofUrl) return { error: "Gagal menyimpan bukti" };
    return { proofUrl: order.paymentProofUrl };
  } catch (e) {
    console.error("submitBankTransferProofAction", e);
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
  revalidateAfterCheckout();

  const text = buildCashWhatsAppMessage({
    template: settings.whatsappTemplate,
    order: {
      id: order.id,
      externalId: order.externalId,
      amount: order.amount,
      buyerName: order.buyerName,
      buyerWhatsapp: order.buyerWhatsapp,
      buyerAddress: order.buyerAddress,
      shipFromBranch: order.shipFromBranch,
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
