import { readFile, stat } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { resolveUploadFile } from "@/lib/uploads";

type RouteParams = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const parts = (await params).path;
  const filename = parts?.[0];
  if (!filename || parts.length !== 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fullPath = resolveUploadFile(filename);
  if (!fullPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const info = await stat(fullPath);
    if (!info.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
    const data = await readFile(fullPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
