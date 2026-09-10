import { NextRequest, NextResponse } from "next/server";
import { markOrderExpired, markOrderPaid } from "@/lib/orders";
import { verifyXenditCallbackToken } from "@/lib/xendit";

export const runtime = "nodejs";

type XenditPayload = {
  id?: string;
  external_id?: string;
  status?: string;
  amount?: number;
  // invoice webhook sometimes nests differently
  data?: {
    id?: string;
    external_id?: string;
    status?: string;
  };
};

/**
 * Xendit callbacks (Invoice + QR Codes).
 * Dashboard → Settings → Callbacks → set URL to /api/xendit/webhook
 * and paste XENDIT_CALLBACK_TOKEN as verification token.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token");
  if (!verifyXenditCallbackToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: XenditPayload;
  try {
    body = (await req.json()) as XenditPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const externalId = body.external_id ?? body.data?.external_id ?? null;
  const xenditId = body.id ?? body.data?.id ?? null;
  const status = (body.status ?? body.data?.status ?? "").toUpperCase();

  if (
    status === "PAID" ||
    status === "SETTLED" ||
    status === "COMPLETED" ||
    status === "SUCCEEDED"
  ) {
    await markOrderPaid({ externalId, xenditId });
    return NextResponse.json({ ok: true });
  }

  if (status === "EXPIRED" || status === "INACTIVE") {
    if (externalId) await markOrderExpired(externalId);
    return NextResponse.json({ ok: true });
  }

  // Acknowledge other events (CREATED, PENDING, etc.)
  return NextResponse.json({ ok: true });
}
