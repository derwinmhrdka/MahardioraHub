"use server";

import { expireFlashSaleNow } from "@/lib/flash-sale";
import { revalidateProducts } from "@/lib/revalidate";

export async function expireFlashSaleAction() {
  await expireFlashSaleNow();
  revalidateProducts();
}
