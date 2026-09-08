/** Secondhand pricing: `price` = normal, discount % → total. */

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function salePrice(price: number, discountPercent: number): number {
  const discount = clampDiscountPercent(discountPercent);
  if (discount <= 0) return Math.round(price);
  return Math.round((Math.round(price) * (100 - discount)) / 100);
}

export function discountFromSalePrice(
  price: number,
  total: number
): number {
  const normal = Math.round(price);
  const sale = Math.round(total);
  if (!Number.isFinite(normal) || normal <= 0) return 0;
  if (!Number.isFinite(sale) || sale >= normal) return 0;
  if (sale <= 0) return 100;
  return clampDiscountPercent((1 - sale / normal) * 100);
}

export function hasDiscount(discountPercent: number | null | undefined): boolean {
  return clampDiscountPercent(discountPercent ?? 0) > 0;
}
