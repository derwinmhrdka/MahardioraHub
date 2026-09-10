import { siteOrigin } from "@/lib/settings";

const XENDIT_API = "https://api.xendit.co";

function secretKey() {
  const key = process.env.XENDIT_SECRET_KEY?.trim();
  if (!key) throw new Error("XENDIT_SECRET_KEY missing");
  return key;
}

function authHeader() {
  const token = Buffer.from(`${secretKey()}:`).toString("base64");
  return `Basic ${token}`;
}

async function xenditFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${XENDIT_API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    error_code?: string;
  };
  if (!res.ok) {
    const msg =
      (typeof data.message === "string" && data.message) ||
      data.error_code ||
      `Xendit ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function xenditConfigured() {
  return Boolean(process.env.XENDIT_SECRET_KEY?.trim());
}

/** Test secret keys start with xnd_development_ */
export function isXenditTestMode() {
  const key = process.env.XENDIT_SECRET_KEY?.trim() ?? "";
  return key.startsWith("xnd_development_");
}

export function verifyXenditCallbackToken(headerToken: string | null) {
  const expected = process.env.XENDIT_CALLBACK_TOKEN?.trim();
  if (!expected) return true; // allow if unset in early test (log warning)
  return Boolean(headerToken && headerToken === expected);
}

export type XenditInvoice = {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  invoice_url: string;
  expiry_date?: string;
};

export async function createXenditInvoice(input: {
  externalId: string;
  amount: number;
  description: string;
  customerEmail?: string | null;
  customerName?: string | null;
}): Promise<XenditInvoice> {
  const origin = siteOrigin();
  const payload: Record<string, unknown> = {
    external_id: input.externalId,
    amount: input.amount,
    description: input.description.slice(0, 255),
    currency: "IDR",
    invoice_duration: 60 * 60,
    success_redirect_url: `${origin}/checkout/success?ext=${encodeURIComponent(input.externalId)}`,
    failure_redirect_url: `${origin}/checkout/failed?ext=${encodeURIComponent(input.externalId)}`,
    items: [
      {
        name: input.description.slice(0, 50),
        quantity: 1,
        price: input.amount,
      },
    ],
  };

  if (input.customerEmail || input.customerName) {
    payload.customer = {
      given_names: (input.customerName || "Customer").slice(0, 64),
      ...(input.customerEmail ? { email: input.customerEmail } : {}),
    };
  }

  return xenditFetch<XenditInvoice>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type XenditQrCode = {
  id: string;
  external_id: string;
  amount: number;
  status: string;
  qr_string: string;
  type: string;
  expires_at?: string;
};

/** Dynamic QRIS (one-time amount). */
export async function createXenditDynamicQris(input: {
  externalId: string;
  amount: number;
}): Promise<XenditQrCode> {
  const origin = siteOrigin();
  return xenditFetch<XenditQrCode>("/qr_codes", {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      type: "DYNAMIC",
      currency: "IDR",
      amount: input.amount,
      callback_url: `${origin}/api/xendit/webhook`,
    }),
  });
}

/** Test mode only — simulates a successful QR payment. */
export async function simulateXenditQrPayment(input: {
  externalId: string;
  amount: number;
}) {
  return xenditFetch<{
    id: string;
    amount: number;
    status: string;
    qr_code?: { external_id?: string; id?: string };
  }>(`/qr_codes/${encodeURIComponent(input.externalId)}/payments/simulate`, {
    method: "POST",
    body: JSON.stringify({ amount: input.amount }),
  });
}
