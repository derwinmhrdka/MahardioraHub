/** Secondhand pricing: `price` = normal, discount % → total. */

/** Precision stored in DB / used for salePrice reconstruction. */
const DISCOUNT_STORAGE_DECIMALS = 6;

/** Precision shown on badges / visitor UI. */
const DISCOUNT_DISPLAY_DECIMALS = 1;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Clamp 0–100 with storage precision (keeps enough digits to reconstruct total). */
export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return roundTo(Math.min(100, Math.max(0, value)), DISCOUNT_STORAGE_DECIMALS);
}

export function salePrice(price: number, discountPercent: number): number {
  const discount = clampDiscountPercent(discountPercent);
  const normal = Math.round(price);
  if (discount <= 0) return normal;
  return Math.round((normal * (100 - discount)) / 100);
}

/** Exact % from normal + typed total (storage precision, not display rounding). */
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

/** Format % for badges/cards: 1 decimal (42.5563 → "42.6", 42.5 → "42.5"). */
export function formatDiscountPercent(value: number): string {
  const n = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const one = roundTo(n, DISCOUNT_DISPLAY_DECIMALS);
  if (Number.isInteger(one)) return String(one);
  return one.toFixed(DISCOUNT_DISPLAY_DECIMALS);
}
