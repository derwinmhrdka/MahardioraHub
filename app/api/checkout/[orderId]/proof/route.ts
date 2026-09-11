import { NextResponse } from "next/server";
import { resolveCartOwner } from "@/lib/cart-owner";
import { attachPaymentProof } from "@/lib/orders";
import { saveProductImage } from "@/lib/uploads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

function isUploadFile(entry: FormDataEntryValue | null): entry is File {
  if (!entry || typeof entry === "string") return false;
  return (
    typeof entry.size === "number" &&
    entry.size > 0 &&
    typeof entry.arrayBuffer === "function"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Order tidak valid" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "File terlalu besar" },
      { status: 413 }
    );
  }

  const bankAccountId = Number(formData.get("bankAccountId"));
  if (!Number.isFinite(bankAccountId)) {
    return NextResponse.json({ error: "Pilih rekening" }, { status: 400 });
  }

  const proof = formData.get("proof");
  if (!isUploadFile(proof)) {
    return NextResponse.json(
      { error: "Upload bukti transfer" },
      { status: 400 }
    );
  }

  try {
    const owner = await resolveCartOwner();
    const proofUrl = await saveProductImage(proof);
    const order = await attachPaymentProof({
      orderId: orderId.trim(),
      owner,
      bankAccountId,
      paymentProofUrl: proofUrl,
    });

    if (!order.paymentProofUrl) {
      return NextResponse.json(
        { error: "Gagal menyimpan bukti" },
        { status: 400 }
      );
    }

    return NextResponse.json({ proofUrl: order.paymentProofUrl });
  } catch (e) {
    console.error("POST /api/checkout/[orderId]/proof", e);
    const message = e instanceof Error ? e.message : "Gagal upload";
    const status =
      message === "Order tidak ditemukan"
        ? 404
        : message === "Order sudah tidak pending"
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
