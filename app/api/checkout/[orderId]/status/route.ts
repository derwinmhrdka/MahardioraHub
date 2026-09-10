import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrderForUser } from "@/lib/orders";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const order = await getOrderForUser(orderId, userId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    amount: order.amount,
  });
}
