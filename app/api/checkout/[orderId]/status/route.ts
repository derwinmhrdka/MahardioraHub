import { NextRequest, NextResponse } from "next/server";
import { resolveCartOwner } from "@/lib/cart-owner";
import { getOrderForOwner } from "@/lib/orders";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const owner = await resolveCartOwner();
  const { orderId } = await context.params;
  const order = await getOrderForOwner(orderId, owner);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    amount: order.amount,
  });
}
