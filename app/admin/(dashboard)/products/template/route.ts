import { NextResponse } from "next/server";
import { productCsvTemplate } from "@/lib/products-csv";

export async function GET() {
  const csv = productCsvTemplate();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="mahardiorahub-products-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
