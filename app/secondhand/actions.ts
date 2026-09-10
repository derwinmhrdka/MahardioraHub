"use server";

import { revalidatePath } from "next/cache";
import { expireFlashSaleNow } from "@/lib/flash-sale";

export async function expireFlashSaleAction() {
  await expireFlashSaleNow();
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
}
