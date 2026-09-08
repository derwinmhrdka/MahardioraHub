"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCategory, deleteCategory } from "@/lib/categories";
import { getSettings, updateSettings } from "@/lib/settings";

export async function updateSettingsAction(formData: FormData) {
  const current = await getSettings();
  const section = String(formData.get("section") ?? "general");

  let siteName = current.siteName;
  let whatsappNumber = current.whatsappNumber;
  let whatsappTemplate = current.whatsappTemplate;
  let contactEmail = current.contactEmail;
  let shopeeAffiliateId = current.shopeeAffiliateId;

  if (section === "general") {
    siteName = String(formData.get("siteName") ?? "").trim();
    shopeeAffiliateId =
      String(formData.get("shopeeAffiliateId") ?? "")
        .trim()
        .replace(/[^\d]/g, "") || null;
    if (!siteName) {
      throw new Error("Site name is required");
    }
  } else if (section === "kontak") {
    whatsappNumber = String(formData.get("whatsappNumber") ?? "")
      .trim()
      .replace(/[^\d]/g, "");
    whatsappTemplate = String(formData.get("whatsappTemplate") ?? "").trim();
    contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
    if (!whatsappNumber || !whatsappTemplate) {
      throw new Error("WhatsApp number and chat template are required");
    }
  }

  await updateSettings({
    siteName,
    whatsappNumber,
    whatsappTemplate,
    contactEmail,
    shopeeAffiliateId,
  });

  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products/new");
  redirect(`/admin/settings?tab=${section === "kontak" ? "kontak" : "general"}&saved=1`);
}

function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
}

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/admin/settings?tab=kategori&catError=1");
  }
  try {
    await createCategory(name);
  } catch {
    redirect("/admin/settings?tab=kategori&catError=1");
  }
  revalidateCategoryPaths();
  redirect("/admin/settings?tab=kategori&catSaved=1");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) {
    redirect("/admin/settings?tab=kategori&catError=1");
  }
  try {
    await deleteCategory(id);
  } catch {
    redirect("/admin/settings?tab=kategori&catError=1");
  }
  revalidateCategoryPaths();
  redirect("/admin/settings?tab=kategori&catSaved=1");
}
