import { NextResponse } from "next/server";
import { listAllProducts } from "@/lib/products";
import { productsToCsv } from "@/lib/products-csv";

export async function GET() {
  const products = await listAllProducts();
  const csv = productsToCsv(products);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mahardiorahub-products-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
