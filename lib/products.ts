import { ProductKind, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ProductCreateInput = {
  kind: ProductKind;
  title: string;
  categoryId: number;
  price: number;
  imageUrl?: string | null;
  shortNote?: string | null;
  storeArea?: string | null;
  shopName?: string | null;
  affiliateLink?: string | null;
  isActive?: boolean;
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export type ProductListFilters = {
  storeArea?: string | null;
  categorySlug?: string | null;
  platform?: string | null;
};

const productInclude = {
  category: true,
} satisfies Prisma.ProductInclude;

function activeWhere(
  kind: ProductKind,
  filters: ProductListFilters = {}
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    kind,
    isActive: true,
  };

  const area = filters.storeArea?.trim();
  if (area) {
    where.storeArea = { equals: area, mode: "insensitive" };
  }

  const categorySlug = filters.categorySlug?.trim();
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const platform = filters.platform?.trim();
  if (platform) {
    where.shopName = { equals: platform, mode: "insensitive" };
  }

  return where;
}

export async function listActiveDeals(filters: ProductListFilters = {}) {
  return prisma.product.findMany({
    where: activeWhere(ProductKind.deal, filters),
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listDealsByCategory(
  categorySlug: string,
  filters: ProductListFilters = {}
) {
  return listActiveDeals({ ...filters, categorySlug });
}

export async function listActiveSecondhand(filters: ProductListFilters = {}) {
  return prisma.product.findMany({
    where: activeWhere(ProductKind.secondhand, filters),
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listStoreAreas(kind?: ProductKind) {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      storeArea: { not: null },
      ...(kind ? { kind } : {}),
    },
    select: { storeArea: true },
    distinct: ["storeArea"],
    orderBy: { storeArea: "asc" },
  });

  return rows
    .map((row) => row.storeArea)
    .filter((area): area is string => Boolean(area && area.trim()));
}

export async function listPlatforms(kind?: ProductKind) {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      shopName: { not: null },
      ...(kind ? { kind } : {}),
    },
    select: { shopName: true },
    distinct: ["shopName"],
    orderBy: { shopName: "asc" },
  });

  return rows
    .map((row) => row.shopName)
    .filter((name): name is string => Boolean(name && name.trim()));
}

export async function listAllProducts() {
  return prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export async function getRelatedDeals(
  productId: number,
  categoryId: number,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      kind: ProductKind.deal,
      isActive: true,
      categoryId,
      id: { not: productId },
    },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createProduct(input: ProductCreateInput) {
  // Optional an_redir helper: see lib/shopee.ts + AffiliateLinkTool (admin UI).
  // Future: Shopee Open API generateShortLink for official short links.
  return prisma.product.create({
    data: {
      kind: input.kind,
      title: input.title,
      categoryId: input.categoryId,
      price: input.price,
      imageUrl: input.imageUrl || null,
      shortNote: input.shortNote || null,
      storeArea: input.storeArea?.trim() || null,
      shopName: input.kind === ProductKind.deal ? input.shopName || null : null,
      affiliateLink:
        input.kind === ProductKind.deal ? input.affiliateLink || null : null,
      isActive: input.isActive ?? true,
    },
    include: productInclude,
  });
}

export async function importProductsFromCsvRows(
  rows: Array<{
    kind: ProductKind;
    title: string;
    category: string;
    price: number;
    imageUrl: string | null;
    shortNote: string | null;
    storeArea: string | null;
    shopName: string | null;
    affiliateLink: string | null;
    isActive: boolean;
  }>
) {
  const categories = await prisma.category.findMany();
  const bySlug = new Map(
    categories.map((c) => [c.slug.toLowerCase(), c] as const)
  );
  const byName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c] as const)
  );

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const key = row.category.trim().toLowerCase();
    const category = bySlug.get(key) ?? byName.get(key);
    if (!category) {
      errors.push(`Row ${i + 2}: category "${row.category}" not found`);
      continue;
    }
    try {
      await createProduct({
        kind: row.kind,
        title: row.title,
        categoryId: category.id,
        price: row.price,
        imageUrl: row.imageUrl,
        shortNote: row.shortNote,
        storeArea: row.storeArea,
        shopName: row.shopName,
        affiliateLink: row.affiliateLink,
        isActive: row.isActive,
      });
      created += 1;
    } catch {
      errors.push(`Row ${i + 2}: failed to create "${row.title}"`);
    }
  }

  return { created, errors };
}

export async function updateProduct(id: number, input: ProductUpdateInput) {
  // Optional an_redir helper: see lib/shopee.ts + AffiliateLinkTool (admin UI).
  // Future: Shopee Open API generateShortLink for official short links.
  const data: Prisma.ProductUpdateInput = {};

  if (input.kind !== undefined) data.kind = input.kind;
  if (input.title !== undefined) data.title = input.title;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }
  if (input.price !== undefined) data.price = input.price;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl || null;
  if (input.shortNote !== undefined) data.shortNote = input.shortNote || null;
  if (input.storeArea !== undefined) {
    data.storeArea = input.storeArea?.trim() || null;
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const kind = input.kind;
  if (kind === ProductKind.secondhand) {
    data.shopName = null;
    data.affiliateLink = null;
  } else {
    if (input.shopName !== undefined) data.shopName = input.shopName || null;
    if (input.affiliateLink !== undefined) {
      data.affiliateLink = input.affiliateLink || null;
    }
  }

  return prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });
}

export async function setProductActive(id: number, isActive: boolean) {
  return prisma.product.update({
    where: { id },
    data: { isActive },
    include: productInclude,
  });
}

export async function deleteProduct(id: number) {
  await prisma.$transaction([
    prisma.click.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
}

export async function getProductForRedirect(id: number) {
  return prisma.product.findFirst({
    where: {
      id,
      kind: ProductKind.deal,
      isActive: true,
      affiliateLink: { not: null },
    },
  });
}
