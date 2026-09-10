import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrderForUser, markOrderPaid } from "@/lib/orders";
import { isXenditTestMode, simulateXenditQrPayment } from "@/lib/xendit";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * Dev helper: hit Xendit QR simulate then mark order paid locally
 * (webhook may not reach localhost).
 */
export async function POST(_req: NextRequest, context: RouteContext) {
  if (!isXenditTestMode()) {
    return NextResponse.json({ error: "Test mode only" }, { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const order = await getOrderForUser(orderId, userId);
  if (!order || order.payMethod !== "qris") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ status: "paid" });
  }
  if (order.status !== "pending") {
    return NextResponse.json(
      { error: `Order ${order.status}` },
      { status: 400 }
    );
  }

  try {
    const payment = await simulateXenditQrPayment({
      externalId: order.externalId,
      amount: order.amount,
    });
    await markOrderPaid({
      externalId: order.externalId,
      xenditId: payment.qr_code?.id ?? order.xenditId,
      orderId: order.id,
    });
    return NextResponse.json({ status: "paid" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulate failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
