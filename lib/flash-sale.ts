import { ProductKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";

const FLASH_SALE_ID = 1;

async function ensureFlashSale() {
  return prisma.flashSale.upsert({
    where: { id: FLASH_SALE_ID },
    create: {
      id: FLASH_SALE_ID,
      isActive: false,
      durationMinutes: 60,
    },
    update: {},
    include: {
      items: {
        include: {
          product: { include: { category: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

/** Clear items + deactivate when timer has ended. */
export async function clearFlashSaleIfExpired(now = new Date()) {
  const row = await prisma.flashSale.findUnique({ where: { id: FLASH_SALE_ID } });
  if (!row) return null;
  if (!row.endsAt || row.endsAt.getTime() > now.getTime()) return row;

  await prisma.$transaction([
    prisma.flashSaleItem.deleteMany({ where: { flashSaleId: FLASH_SALE_ID } }),
    prisma.flashSale.update({
      where: { id: FLASH_SALE_ID },
      data: {
        isActive: false,
        startedAt: null,
        endsAt: null,
      },
    }),
  ]);

  return prisma.flashSale.findUnique({ where: { id: FLASH_SALE_ID } });
}

export async function getFlashSaleAdmin() {
  await clearFlashSaleIfExpired();
  return ensureFlashSale();
}

export async function listSecondhandForFlashSale() {
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

export type FlashSalePublic = {
  endsAt: string;
  startedAt: string;
  durationMinutes: number;
  items: Array<{
    productId: number;
    title: string;
    price: number;
    discountPercent: number;
    imageUrl: string | null;
    href: string;
  }>;
};

/** Visitor-facing flash sale; null if inactive / empty / expired. */
export async function getActiveFlashSalePublic(): Promise<FlashSalePublic | null> {
  await clearFlashSaleIfExpired();
  const row = await ensureFlashSale();

  if (!row.isActive || !row.endsAt || !row.startedAt) return null;
  if (row.endsAt.getTime() <= Date.now()) return null;

  const items = row.items
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

  if (items.length === 0) return null;

  return {
    endsAt: row.endsAt.toISOString(),
    startedAt: row.startedAt.toISOString(),
    durationMinutes: row.durationMinutes,
    items,
  };
}

export async function updateFlashSaleConfig(input: {
  isActive: boolean;
  durationMinutes: number;
  productIds: number[];
}) {
  const durationMinutes = Math.max(
    1,
    Math.min(24 * 60, Math.round(input.durationMinutes))
  );
  const uniqueIds = Array.from(new Set(input.productIds.filter(Number.isFinite)));

  const products = uniqueIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: uniqueIds },
          kind: ProductKind.secondhand,
          isActive: true,
        },
        select: { id: true },
      })
    : [];
  const validIds = new Set(products.map((p) => p.id));
  const orderedIds = uniqueIds.filter((id) => validIds.has(id));

  const now = new Date();
  const current = await ensureFlashSale();

  let startedAt = current.startedAt;
  let endsAt = current.endsAt;

  if (input.isActive) {
    if (!current.isActive || !startedAt || !endsAt || endsAt <= now) {
      startedAt = now;
      endsAt = new Date(now.getTime() + durationMinutes * 60_000);
    } else {
      // Keep start; recompute end from start + new duration
      endsAt = new Date(startedAt.getTime() + durationMinutes * 60_000);
      if (endsAt <= now) {
        startedAt = now;
        endsAt = new Date(now.getTime() + durationMinutes * 60_000);
      }
    }
  } else {
    startedAt = null;
    endsAt = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.flashSaleItem.deleteMany({ where: { flashSaleId: FLASH_SALE_ID } });
    if (orderedIds.length > 0) {
      await tx.flashSaleItem.createMany({
        data: orderedIds.map((productId, index) => ({
          flashSaleId: FLASH_SALE_ID,
          productId,
          sortOrder: index,
        })),
      });
    }
    await tx.flashSale.update({
      where: { id: FLASH_SALE_ID },
      data: {
        isActive: input.isActive,
        durationMinutes,
        startedAt,
        endsAt,
      },
    });
  });

  return getFlashSaleAdmin();
}

/** Called from client when local timer hits zero. */
export async function expireFlashSaleNow() {
  const row = await prisma.flashSale.findUnique({ where: { id: FLASH_SALE_ID } });
  if (!row) return;
  await prisma.$transaction([
    prisma.flashSaleItem.deleteMany({ where: { flashSaleId: FLASH_SALE_ID } }),
    prisma.flashSale.update({
      where: { id: FLASH_SALE_ID },
      data: {
        isActive: false,
        startedAt: null,
        endsAt: null,
      },
    }),
  ]);
}
