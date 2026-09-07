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

export async function renameCategory(id: number, name: string) {
  const trimmed = name.trim();
  const base = slugify(trimmed);
  let slug = base || "category";
  let attempt = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === id) break;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return prisma.category.update({
    where: { id },
    data: { name: trimmed, slug },
  });
}
