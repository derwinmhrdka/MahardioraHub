import { NextRequest, NextResponse } from "next/server";
import { lookupBuyerByWhatsapp } from "@/lib/buyer";
import {
  clientRateKey,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = rateLimit(clientRateKey(req, "buyer-lookup"), 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const wa = req.nextUrl.searchParams.get("wa") ?? "";
  const profile = await lookupBuyerByWhatsapp(wa);
  if (!profile) {
    return NextResponse.json(null);
  }
  return NextResponse.json(profile);
}
