import { NextRequest, NextResponse } from "next/server";
import { logClick } from "@/lib/clicks";
import { getProductForRedirect } from "@/lib/products";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { productId: rawId } = await context.params;
  const productId = Number(rawId);

  if (!Number.isFinite(productId)) {
    return NextResponse.redirect(new URL("/", _request.url), 302);
  }

  const product = await getProductForRedirect(productId);
  if (!product || !product.affiliateLink) {
    return NextResponse.redirect(new URL("/", _request.url), 302);
  }

  await logClick(product.id);
  return NextResponse.redirect(product.affiliateLink, 302);
}
