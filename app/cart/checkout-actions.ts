"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { countActiveBankAccounts } from "@/lib/bank-accounts";
import { resolveCheckoutBranch } from "@/lib/branches";
import { parseBuyerInput, saveBuyerProfile } from "@/lib/buyer";
import { resolveCartOwner } from "@/lib/cart-owner";
import {
  createBankTransferCheckout,
  createCashCheckout,
  createQrisCheckout,
} from "@/lib/orders";
import { qrisConfigured } from "@/lib/qris-provider";

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
  const order = await createBankTransferCheckout({ owner, buyer });
  revalidateAfterCheckout();
  redirect(`/checkout/${order.id}`);
}

export async function checkoutCashAction(formData: FormData) {
  const { owner, buyer } = await prepareCheckout(formData);
  const order = await createCashCheckout({ owner, buyer });
  revalidateAfterCheckout();
  redirect(`/orders/${order.id}?contact=1`);
}
