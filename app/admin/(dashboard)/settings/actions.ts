"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderPayProvider } from "@prisma/client";
import { createCategory, deleteCategory } from "@/lib/categories";
import { requireAdmin } from "@/lib/auth";
import {
  updateFlashSaleConfig,
} from "@/lib/flash-sale";
import { getSettings, updateSettings } from "@/lib/settings";
import { grantAdminByEmail, revokeAdminByEmail } from "@/lib/users";

export async function updateFlashSaleAction(formData: FormData) {
  await requireAdmin();
  const isActive = String(formData.get("isActive") ?? "") === "on";
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const productIds = formData
    .getAll("productIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  try {
    await updateFlashSaleConfig({
      isActive,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 60,
      productIds,
    });
  } catch {
    redirect("/admin/settings?tab=flash&flashError=1");
  }

  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?tab=flash&flashSaved=1");
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const current = await getSettings();
  const section = String(formData.get("section") ?? "general");

  let siteName = current.siteName;
  let whatsappNumber = current.whatsappNumber;
  let whatsappTemplate = current.whatsappTemplate;
  let contactEmail = current.contactEmail;
  let shopeeAffiliateId = current.shopeeAffiliateId;
  let qrisProvider = current.qrisProvider;

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
  } else if (section === "payment") {
    const raw = String(formData.get("qrisProvider") ?? "").trim().toLowerCase();
    qrisProvider =
      raw === "xendit" ? OrderPayProvider.xendit : OrderPayProvider.midtrans;
  }

  await updateSettings({
    siteName,
    whatsappNumber,
    whatsappTemplate,
    contactEmail,
    shopeeAffiliateId,
    qrisProvider,
  });

  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products/new");

  const tab =
    section === "kontak"
      ? "kontak"
      : section === "payment"
        ? "payment"
        : "general";
  redirect(`/admin/settings?tab=${tab}&saved=1`);
}

function revalidateCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/secondhand");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
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
  await requireAdmin();
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

function revalidateUserTab() {
  revalidatePath("/admin/settings");
}

export async function addAdminAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  try {
    await grantAdminByEmail(email);
  } catch {
    redirect("/admin/settings?tab=user&userError=1");
  }
  revalidateUserTab();
  redirect("/admin/settings?tab=user&userSaved=1");
}

export async function makeAdminAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  try {
    await grantAdminByEmail(email);
  } catch {
    redirect("/admin/settings?tab=user&userError=1");
  }
  revalidateUserTab();
  redirect("/admin/settings?tab=user&userSaved=1");
}

export async function revokeAdminAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  try {
    await revokeAdminByEmail(email);
  } catch {
    redirect("/admin/settings?tab=user&userError=1");
  }
  revalidateUserTab();
  redirect("/admin/settings?tab=user&userSaved=1");
}
