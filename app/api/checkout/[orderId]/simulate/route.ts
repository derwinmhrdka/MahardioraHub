import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrderForUser, markOrderPaid } from "@/lib/orders";
import { isMidtransSandbox } from "@/lib/midtrans";
import { isXenditTestMode, simulateXenditQrPayment } from "@/lib/xendit";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * Dev helper: simulate QRIS pay then mark order paid locally
 * (webhook may not reach localhost).
 */
export async function POST(_req: NextRequest, context: RouteContext) {
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

  const provider = order.payProvider ?? "midtrans";

  try {
    if (provider === "xendit") {
      if (!isXenditTestMode()) {
        return NextResponse.json({ error: "Test mode only" }, { status: 403 });
      }
      const payment = await simulateXenditQrPayment({
        externalId: order.externalId,
        amount: order.amount,
      });
      await markOrderPaid({
        externalId: order.externalId,
        pspId: payment.qr_code?.id ?? order.pspId,
        orderId: order.id,
      });
      return NextResponse.json({ status: "paid" });
    }

    if (!isMidtransSandbox()) {
      return NextResponse.json({ error: "Sandbox only" }, { status: 403 });
    }

    // Midtrans sandbox: mark paid locally (dashboard simulator also hits webhook).
    await markOrderPaid({
      externalId: order.externalId,
      pspId: order.pspId,
      orderId: order.id,
    });
    return NextResponse.json({ status: "paid" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulate failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
