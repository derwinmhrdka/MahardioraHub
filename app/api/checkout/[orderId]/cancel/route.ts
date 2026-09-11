import { NextResponse } from "next/server";
import { resolveCartOwner } from "@/lib/cart-owner";
import { log } from "@/lib/logger";
import { cancelOwnerOrder } from "@/lib/orders";
import {
  clientRateKey,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/** Cancel pending unpaid checkout (used on leave / beacon). */
export async function POST(request: Request, context: RouteContext) {
  const limited = rateLimit(clientRateKey(request, "cancel"), 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

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
    log.info("checkout.cancelled", { orderId: order.id, status: order.status });
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    log.warn("checkout.cancel_failed", {
      orderId,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Gagal cancel" }, { status: 400 });
  }
}
