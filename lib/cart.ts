import { ProductKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { salePrice } from "@/lib/pricing";
import { productPageUrl } from "@/lib/settings";

const MAX_QTY = 20;

const secondhandActive = {
  isActive: true,
  kind: ProductKind.secondhand,
} as const;

function clampQty(qty: number, stock: number) {
  const max = Math.max(0, Math.min(MAX_QTY, Math.max(0, Math.round(stock))));
  return Math.min(max, Math.max(0, Math.round(qty)));
}

export async function getCartCount(userId: string): Promise<number> {
  const items = await prisma.cartItem.findMany({
    where: { userId, product: secondhandActive },
    select: {
      quantity: true,
      product: { select: { stock: true } },
    },
  });
  return items.reduce(
    (sum, item) => sum + clampQty(item.quantity, item.product.stock),
    0
  );
}

export async function listCartItems(userId: string) {
  const rows = await prisma.cartItem.findMany({
    where: { userId, product: secondhandActive },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Drop / clamp lines that exceed current stock
  const kept = [];
  for (const row of rows) {
    const qty = clampQty(row.quantity, row.product.stock);
    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: row.id } });
      continue;
    }
    if (qty !== row.quantity) {
      await prisma.cartItem.update({
        where: { id: row.id },
        data: { quantity: qty },
      });
      kept.push({ ...row, quantity: qty });
      continue;
    }
    kept.push(row);
  }
  return kept;
}

export async function addToCart(userId: string, productId: number, qty = 1) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ...secondhandActive },
    select: { id: true, stock: true },
  });
  if (!product) throw new Error("Not found");
  if (product.stock <= 0) throw new Error("Out of stock");

  const addQty = Math.max(1, Math.round(qty));
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    const nextQty = clampQty(existing.quantity + addQty, product.stock);
    if (nextQty <= 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
      return null;
    }
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  }

  const quantity = clampQty(addQty, product.stock);
  if (quantity <= 0) throw new Error("Out of stock");

  return prisma.cartItem.create({
    data: { userId, productId, quantity },
  });
}

export async function setCartQuantity(
  userId: string,
  productId: number,
  quantity: number
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, ...secondhandActive },
    select: { stock: true },
  });
  if (!product) {
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
    return null;
  }

  const qty = clampQty(quantity, product.stock);
  if (qty <= 0) {
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
    return null;
  }

  return prisma.cartItem.updateMany({
    where: { userId, productId },
    data: { quantity: qty },
  });
}

export async function removeFromCart(userId: string, productId: number) {
  await prisma.cartItem.deleteMany({ where: { userId, productId } });
}

export function cartLineTotal(price: number, discountPercent: number, quantity: number) {
  return salePrice(price, discountPercent) * quantity;
}

export function buildCartWhatsAppMessage(input: {
  template: string;
  items: Array<{
    title: string;
    quantity: number;
    id: number;
    unitPrice: number;
  }>;
}): string {
  const intro = input.template.trim();
  const lines = input.items.map((item, i) => {
    const link = productPageUrl("secondhand", item.id);
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}\n   ${link}`;
  });
  const total = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  return [
    intro,
    "",
    "Cart :",
    ...lines,
    "",
    `Total : Rp ${total.toLocaleString("id-ID")}`,
  ].join("\n");
}
