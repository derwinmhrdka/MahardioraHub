import { NextResponse } from "next/server";
import { resolveCartOwner } from "@/lib/cart-owner";
import { cancelOwnerOrder } from "@/lib/orders";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/** Cancel pending unpaid checkout (used on leave / beacon). */
export async function POST(_request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  try {
    const owner = await resolveCartOwner();
    const order = await cancelOwnerOrder(orderId.trim(), owner);
    if (!order) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    console.error("POST /api/checkout/[orderId]/cancel", e);
    return NextResponse.json({ error: "Gagal cancel" }, { status: 400 });
  }
}
