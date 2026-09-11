import { ProductKind } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "./cache-tags";
import { prisma } from "./prisma";
import { slugify } from "./format";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

/** Public catalog chips/filters: only categories that currently have products. */
export async function listCatalogCategories(kind: ProductKind) {
  return unstable_cache(
    async () => {
      const productWhere: {
        kind: ProductKind;
        isActive: boolean;
        id?: { notIn: number[] };
      } = {
        kind,
        isActive: true,
      };

      if (kind === ProductKind.secondhand) {
        const { listExpiredPreOrderProductIds } = await import(
          "@/lib/pre-order"
        );
        const expiredIds = await listExpiredPreOrderProductIds();
        if (expiredIds.length > 0) {
          productWhere.id = { notIn: expiredIds };
        }
      }

      return prisma.category.findMany({
        where: {
          products: { some: productWhere },
        },
        orderBy: { name: "asc" },
      });
    },
    ["catalog-categories", kind],
    { tags: [CACHE_TAGS.products], revalidate: 60 }
  )();
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
