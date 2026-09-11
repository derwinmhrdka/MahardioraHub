import { ProductKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";

/** YYYY-MM-DD in Asia/Jakarta. */
export function jakartaTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Normalize Prisma @db.Date / Date to YYYY-MM-DD. */
export function dateToYmd(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function parseLastOrderDate(raw: string): Date {
  const ymd = raw.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("Tanggal invalid");
  }
  return new Date(`${ymd}T00:00:00.000Z`);
}

const batchInclude = {
  items: {
    include: {
      product: { include: { category: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function listPreOrdersAdmin() {
  return prisma.preOrder.findMany({
    include: batchInclude,
    orderBy: [{ lastOrderDate: "desc" }, { id: "desc" }],
  });
}

export async function listSecondhandForPreOrder() {
  return prisma.product.findMany({
    where: {
      kind: ProductKind.secondhand,
      isActive: true,
      stock: { gt: 0 },
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Product IDs whose last-order date is already past (hide from Collection). */
export async function listExpiredPreOrderProductIds(
  now = new Date()
): Promise<number[]> {
  const today = jakartaTodayYmd(now);
  const rows = await prisma.preOrderItem.findMany({
    where: {
      preOrder: {
        lastOrderDate: { lt: new Date(`${today}T00:00:00.000Z`) },
      },
    },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}

/** Active / last-day pre-order map: productId → lastOrder YMD. */
export async function mapActivePreOrderByProductId(
  now = new Date()
): Promise<Map<number, string>> {
  const today = jakartaTodayYmd(now);
  const rows = await prisma.preOrderItem.findMany({
    where: {
      preOrder: {
        lastOrderDate: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
      product: {
        kind: ProductKind.secondhand,
        isActive: true,
      },
    },
    select: {
      productId: true,
      preOrder: { select: { lastOrderDate: true } },
    },
  });

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.productId, dateToYmd(row.preOrder.lastOrderDate));
  }
  return map;
}

export async function getProductPreOrderTag(
  productId: number,
  now = new Date()
): Promise<{ lastOrderDate: string } | null> {
  const today = jakartaTodayYmd(now);
  const row = await prisma.preOrderItem.findFirst({
    where: {
      productId,
      preOrder: {
        lastOrderDate: { gte: new Date(`${today}T00:00:00.000Z`) },
      },
    },
    select: {
      preOrder: { select: { lastOrderDate: true } },
    },
  });
  if (!row) return null;
  return { lastOrderDate: dateToYmd(row.preOrder.lastOrderDate) };
}

export type PreOrderPublic = {
  lastOrderDate: string;
  items: Array<{
    productId: number;
    title: string;
    price: number;
    discountPercent: number;
    imageUrl: string | null;
    href: string;
  }>;
};

/** Strip for Collection: only when today is a last-order day. */
export async function getTodayPreOrderPublic(
  now = new Date()
): Promise<PreOrderPublic | null> {
  const today = jakartaTodayYmd(now);
  const batches = await prisma.preOrder.findMany({
    where: {
      lastOrderDate: new Date(`${today}T00:00:00.000Z`),
    },
    include: batchInclude,
    orderBy: { id: "asc" },
  });

  const items = batches
    .flatMap((batch) => batch.items)
    .filter(
      (item) =>
        item.product.kind === ProductKind.secondhand &&
        item.product.isActive &&
        item.product.stock > 0
    )
    .map((item) => ({
      productId: item.productId,
      title: item.product.title,
      price: item.product.price,
      discountPercent: item.product.discountPercent,
      imageUrl: productImages(item.product)[0] ?? null,
      href: `/secondhand/${item.productId}`,
    }));

  // Dedupe by productId (keep first)
  const seen = new Set<number>();
  const unique = items.filter((item) => {
    if (seen.has(item.productId)) return false;
    seen.add(item.productId);
    return true;
  });

  if (unique.length === 0) return null;
  return { lastOrderDate: today, items: unique };
}

async function resolveProductIds(productIds: number[]) {
  const uniqueIds = Array.from(
    new Set(productIds.filter((id) => Number.isFinite(id)))
  );
  if (uniqueIds.length === 0) return [] as number[];

  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueIds },
      kind: ProductKind.secondhand,
      isActive: true,
    },
    select: { id: true },
  });
  const valid = new Set(products.map((p) => p.id));
  return uniqueIds.filter((id) => valid.has(id));
}

export async function createPreOrder(input: {
  lastOrderDate: string;
  productIds: number[];
}) {
  const lastOrderDate = parseLastOrderDate(input.lastOrderDate);
  const orderedIds = await resolveProductIds(input.productIds);

  return prisma.$transaction(async (tx) => {
    if (orderedIds.length > 0) {
      await tx.preOrderItem.deleteMany({
        where: { productId: { in: orderedIds } },
      });
    }
    return tx.preOrder.create({
      data: {
        lastOrderDate,
        items: {
          create: orderedIds.map((productId, index) => ({
            productId,
            sortOrder: index,
          })),
        },
      },
      include: batchInclude,
    });
  });
}

export async function updatePreOrder(input: {
  id: number;
  lastOrderDate: string;
  productIds: number[];
}) {
  const existing = await prisma.preOrder.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Pre order tidak ditemukan");

  const lastOrderDate = parseLastOrderDate(input.lastOrderDate);
  const orderedIds = await resolveProductIds(input.productIds);

  return prisma.$transaction(async (tx) => {
    if (orderedIds.length > 0) {
      await tx.preOrderItem.deleteMany({
        where: {
          productId: { in: orderedIds },
          NOT: { preOrderId: input.id },
        },
      });
    }
    await tx.preOrderItem.deleteMany({ where: { preOrderId: input.id } });
    if (orderedIds.length > 0) {
      await tx.preOrderItem.createMany({
        data: orderedIds.map((productId, index) => ({
          preOrderId: input.id,
          productId,
          sortOrder: index,
        })),
      });
    }
    return tx.preOrder.update({
      where: { id: input.id },
      data: { lastOrderDate },
      include: batchInclude,
    });
  });
}

export async function deletePreOrder(id: number) {
  await prisma.preOrder.delete({ where: { id } });
}
