import { ProductKind } from "@prisma/client";

export const PRODUCT_CSV_HEADERS = [
  "kind",
  "title",
  "category",
  "price",
  "imageUrl",
  "shortNote",
  "storeArea",
  "shopName",
  "affiliateLink",
  "isActive",
] as const;

export type ProductCsvRow = {
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
};

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => escapeCsv(cell)).join(",")).join("\n");
}

export function productCsvTemplate(): string {
  return toCsv([
    [...PRODUCT_CSV_HEADERS],
    [
      "deal",
      "Sample deal title",
      "electronics",
      "99000",
      "https://example.com/image.jpg",
      "Short note",
      "Jakarta",
      "Shopee",
      "https://shopee.co.id/...",
      "true",
    ],
    [
      "secondhand",
      "Sample secondhand title",
      "home",
      "150000",
      "",
      "Good condition",
      "Bandung",
      "",
      "",
      "true",
    ],
  ]);
}

export function productsToCsv(
  products: Array<{
    kind: ProductKind;
    title: string;
    category: { slug: string };
    price: number;
    imageUrl: string | null;
    shortNote: string | null;
    storeArea: string | null;
    shopName: string | null;
    affiliateLink: string | null;
    isActive: boolean;
  }>
): string {
  const rows: string[][] = [[...PRODUCT_CSV_HEADERS]];
  for (const product of products) {
    rows.push([
      product.kind,
      product.title,
      product.category.slug,
      String(product.price),
      product.imageUrl ?? "",
      product.shortNote ?? "",
      product.storeArea ?? "",
      product.shopName ?? "",
      product.affiliateLink ?? "",
      product.isActive ? "true" : "false",
    ]);
  }
  return toCsv(rows);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseBool(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return true;
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

export function parseProductCsv(text: string): {
  rows: ProductCsvRow[];
  errors: string[];
} {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  const errors: string[] = [];
  const rows: ProductCsvRow[] = [];

  if (lines.length === 0) {
    return { rows, errors: ["CSV is empty"] };
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const index = Object.fromEntries(
    PRODUCT_CSV_HEADERS.map((key) => [key, headerCells.indexOf(key)])
  ) as Record<(typeof PRODUCT_CSV_HEADERS)[number], number>;

  for (const required of ["kind", "title", "category", "price"] as const) {
    if (index[required] < 0) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  if (errors.length > 0) return { rows, errors };

  for (let i = 1; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const cells = parseCsvLine(lines[i]);
    const get = (key: (typeof PRODUCT_CSV_HEADERS)[number]) => {
      const idx = index[key];
      return idx >= 0 ? (cells[idx] ?? "").trim() : "";
    };

    const kindRaw = get("kind").toLowerCase();
    if (kindRaw !== "deal" && kindRaw !== "secondhand") {
      errors.push(`Row ${lineNo}: kind must be deal or secondhand`);
      continue;
    }
    const title = get("title");
    const category = get("category");
    const price = Number(get("price"));
    if (!title || !category || !Number.isFinite(price)) {
      errors.push(`Row ${lineNo}: title, category, and price are required`);
      continue;
    }

    const kind = kindRaw as ProductKind;
    rows.push({
      kind,
      title,
      category,
      price: Math.round(price),
      imageUrl: get("imageUrl") || null,
      shortNote: get("shortNote") || null,
      storeArea: get("storeArea") || null,
      shopName: kind === ProductKind.deal ? get("shopName") || null : null,
      affiliateLink:
        kind === ProductKind.deal ? get("affiliateLink") || null : null,
      isActive: parseBool(get("isActive")),
    });
  }

  return { rows, errors };
}
