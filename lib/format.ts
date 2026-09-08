export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Keep digits only from typed money text. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Format digit string with Indonesian thousand separators (1.500.000). */
export function formatGroupedDigits(raw: string): string {
  const digits = digitsOnly(raw).replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseGroupedNumber(raw: string): number {
  const digits = digitsOnly(raw);
  if (!digits) return NaN;
  return Number(digits);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
