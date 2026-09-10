import { NextRequest, NextResponse } from "next/server";
import {
  markOrderCancelled,
  markOrderExpired,
  markOrderFailed,
  markOrderPaid,
} from "@/lib/orders";
import { verifyMidtransNotification } from "@/lib/midtrans";

export const runtime = "nodejs";

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
};

/**
 * Midtrans payment notification.
 * Dashboard → Settings → Configuration → Payment Notification URL
 * → https://YOUR_DOMAIN/api/midtrans/webhook
 */
export async function POST(req: NextRequest) {
  let body: MidtransNotification;
  try {
    body = (await req.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyMidtransNotification(body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const externalId = body.order_id ?? null;
  const pspId = body.transaction_id ?? null;
  const status = (body.transaction_status ?? "").toLowerCase();
  const fraud = (body.fraud_status ?? "").toLowerCase();

  if (
    status === "settlement" ||
    (status === "capture" && fraud === "accept")
  ) {
    await markOrderPaid({ externalId, pspId });
    return NextResponse.json({ ok: true });
  }

  if (status === "expire") {
    if (externalId) await markOrderExpired(externalId);
    return NextResponse.json({ ok: true });
  }

  if (status === "cancel") {
    if (externalId) await markOrderCancelled(externalId);
    return NextResponse.json({ ok: true });
  }

  if (status === "deny") {
    if (externalId) await markOrderFailed(externalId);
    return NextResponse.json({ ok: true });
  }

  // pending, etc.
  return NextResponse.json({ ok: true });
}
