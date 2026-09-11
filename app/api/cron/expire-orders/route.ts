import { NextResponse } from "next/server";
import { expireAllOverdueOrders } from "@/lib/orders/expire";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocalRequest(request: Request) {
  try {
    const host = new URL(request.url).hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

function authorized(request: Request) {
  // Container entrypoint / local loopback may call without a secret.
  if (isLocalRequest(request)) return true;

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization")?.trim() ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const query = new URL(request.url).searchParams.get("secret")?.trim() ?? "";
  return bearer === secret || query === secret;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireAllOverdueOrders();
    log.info("cron.expire_orders", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error("cron.expire_orders_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
