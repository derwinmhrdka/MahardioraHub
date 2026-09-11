import { NextRequest, NextResponse } from "next/server";
import { lookupBuyerByWhatsapp } from "@/lib/buyer";

export async function GET(req: NextRequest) {
  const wa = req.nextUrl.searchParams.get("wa") ?? "";
  const profile = await lookupBuyerByWhatsapp(wa);
  if (!profile) {
    return NextResponse.json(null);
  }
  return NextResponse.json(profile);
}
