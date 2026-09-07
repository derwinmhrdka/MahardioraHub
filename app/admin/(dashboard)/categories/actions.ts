"use server";

import { revalidatePath } from "next/cache";
import { createCategory, renameCategory } from "@/lib/categories";

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  await createCategory(name);
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function renameCategoryAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isFinite(id) || !name) throw new Error("Invalid category");
  await renameCategory(id, name);
  revalidatePath("/");
  revalidatePath("/admin/categories");
}
