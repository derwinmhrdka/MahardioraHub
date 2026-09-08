import { prisma } from "./prisma";
import { slugify } from "./format";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function createCategory(name: string) {
  const base = slugify(name);
  let slug = base || "category";
  let attempt = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return prisma.category.create({
    data: { name: name.trim(), slug },
  });
}

export async function findOrCreateCategoryByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nama kategori kosong");

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing;
  return createCategory(trimmed);
}

export async function deleteCategory(id: number) {
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) {
    throw new Error("Dipakai");
  }
  await prisma.category.delete({ where: { id } });
}
