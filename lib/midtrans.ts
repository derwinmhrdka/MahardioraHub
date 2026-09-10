import { createHash } from "crypto";

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!key) throw new Error("MIDTRANS_SERVER_KEY missing");
  return key;
}

export function midtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY?.trim());
}

export function isMidtransSandbox() {
  return process.env.MIDTRANS_IS_PRODUCTION?.trim() !== "true";
}

function apiBase() {
  return isMidtransSandbox()
    ? "https://api.sandbox.midtrans.com"
    : "https://api.midtrans.com";
}

function authHeader() {
  return `Basic ${Buffer.from(`${serverKey()}:`).toString("base64")}`;
}

async function midtransFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    status_message?: string;
    status_code?: string;
    error_messages?: string[];
  };
  const code = Number(data.status_code ?? res.status);
  if (!res.ok || (code >= 400 && !Number.isNaN(code))) {
    const msg =
      data.error_messages?.join("; ") ||
      data.status_message ||
      `Midtrans ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export type MidtransQrisCharge = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  qr_string?: string;
  expire_time?: string;
  actions?: Array<{ name: string; method: string; url: string }>;
};

/** Core API QRIS charge. orderId must be unique (use Order.externalId). */
export async function createMidtransQris(input: {
  orderId: string;
  amount: number;
}): Promise<MidtransQrisCharge> {
  return midtransFetch<MidtransQrisCharge>("/v2/charge", {
    method: "POST",
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount,
      },
      qris: {
        acquirer: "gopay",
      },
    }),
  });
}

function signatureKey(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}) {
  return createHash("sha512")
    .update(
      `${input.orderId}${input.statusCode}${input.grossAmount}${input.serverKey}`
    )
    .digest("hex");
}

export function verifyMidtransNotification(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  if (
    !body.order_id ||
    !body.status_code ||
    !body.gross_amount ||
    !body.signature_key
  ) {
    return false;
  }
  const expected = signatureKey({
    orderId: body.order_id,
    statusCode: body.status_code,
    grossAmount: body.gross_amount,
    serverKey: serverKey(),
  });
  return expected === body.signature_key;
}

/** Parse Midtrans expire_time "YYYY-MM-DD HH:mm:ss" as Date. */
export function parseMidtransExpireTime(value: string | undefined | null) {
  if (!value) return null;
  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T") + "+07:00";
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}
