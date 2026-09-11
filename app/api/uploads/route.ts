import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { log } from "@/lib/logger";
import {
  clientRateKey,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { MAX_UPLOAD_COUNT, saveProductImage } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(clientRateKey(request, "uploads"), 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "Pilih file" }, { status: 400 });
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    return NextResponse.json(
      { error: `Max ${MAX_UPLOAD_COUNT} file` },
      { status: 400 }
    );
  }

  try {
    const urls: string[] = [];
    for (const file of files) {
      urls.push(await saveProductImage(file));
    }
    log.info("uploads.saved", { count: urls.length, userId: session.user.id });
    return NextResponse.json({ urls });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal";
    log.warn("uploads.failed", { error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
