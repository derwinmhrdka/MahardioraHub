/** Secondhand pricing: `price` = normal, discount % → total. */

const DISCOUNT_DECIMALS = 2;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return roundTo(Math.min(100, Math.max(0, value)), DISCOUNT_DECIMALS);
}

export function salePrice(price: number, discountPercent: number): number {
  const discount = clampDiscountPercent(discountPercent);
  const normal = Math.round(price);
  if (discount <= 0) return normal;
  // Keep as much precision as possible before final rupiah round
  return Math.round((normal * (100 - discount)) / 100);
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

/** Format % for badges/cards: integer if .0, else 1 decimal. */
export function formatDiscountPercent(value: number): string {
  const one = roundTo(clampDiscountPercent(value), 1);
  if (Number.isInteger(one)) return String(one);
  return one.toFixed(1);
}
