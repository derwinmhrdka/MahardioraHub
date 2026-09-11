import { NextRequest, NextResponse } from "next/server";
import { resolveCartOwner } from "@/lib/cart-owner";
import { log } from "@/lib/logger";
import { getOrderForOwner, markOrderPaid } from "@/lib/orders";
import { isMidtransSandbox } from "@/lib/midtrans";
import {
  clientRateKey,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { isXenditTestMode, simulateXenditQrPayment } from "@/lib/xendit";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * Dev helper: simulate QRIS pay then mark order paid locally
 * (webhook may not reach localhost).
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = rateLimit(clientRateKey(req, "simulate"), 10, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const owner = await resolveCartOwner();
  const { orderId } = await context.params;
  const order = await getOrderForOwner(orderId, owner);
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
      log.info("checkout.simulate_paid", { orderId: order.id, provider });
      return NextResponse.json({ status: "paid" });
    }

    if (!isMidtransSandbox()) {
      return NextResponse.json({ error: "Sandbox only" }, { status: 403 });
    }

    await markOrderPaid({
      externalId: order.externalId,
      pspId: order.pspId,
      orderId: order.id,
    });
    log.info("checkout.simulate_paid", { orderId: order.id, provider });
    return NextResponse.json({ status: "paid" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulate failed";
    log.warn("checkout.simulate_failed", { orderId, error: message });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
