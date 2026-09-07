"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateSettings } from "@/lib/settings";

export async function updateSettingsAction(formData: FormData) {
  const siteName = String(formData.get("siteName") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "")
    .trim()
    .replace(/[^\d]/g, "");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const shopeeAffiliateId = String(formData.get("shopeeAffiliateId") ?? "")
    .trim()
    .replace(/[^\d]/g, "");

  if (!siteName || !whatsappNumber) {
    throw new Error("Site name and WhatsApp number are required");
  }

  await updateSettings({
    siteName,
    whatsappNumber,
    contactEmail: contactEmail || null,
    shopeeAffiliateId: shopeeAffiliateId || null,
  });

  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products/new");
  redirect("/admin/settings?saved=1");
}
