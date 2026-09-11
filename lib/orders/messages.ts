import { orderPageUrl } from "@/lib/settings";

type OrderMessageOrder = {
  id: string;
  externalId: string;
  amount: number;
  buyerName?: string;
  buyerWhatsapp?: string;
  buyerAddress?: string;
  shipFromBranch?: string | null;
  items: Array<{
    productId: number;
    title: string;
    quantity: number;
    unitPrice: number;
  }>;
};

function itemLines(order: OrderMessageOrder) {
  return order.items.map((item, i) => {
    return `${i + 1}. ${item.title} x${item.quantity} — Rp ${item.unitPrice.toLocaleString("id-ID")}`;
  });
}

function buyerLines(order: OrderMessageOrder) {
  return [
    order.buyerName ? `Nama : ${order.buyerName}` : null,
    order.buyerWhatsapp ? `WA : ${order.buyerWhatsapp}` : null,
    order.buyerAddress ? `Alamat : ${order.buyerAddress}` : null,
    order.shipFromBranch ? `Dikirim dari : ${order.shipFromBranch}` : null,
  ];
}

function buildOrderWhatsAppMessage(input: {
  intro: string[];
  payLabel: string;
  statusLine?: string | null;
  order: OrderMessageOrder;
}): string {
  const invoiceNo = input.order.externalId;
  const orderLink = orderPageUrl(input.order.id);
  return [
    ...input.intro,
    "",
    `Invoice : ${invoiceNo}`,
    `Bayar : ${input.payLabel}`,
    input.statusLine ?? null,
    `Pesanan : ${orderLink}`,
    ...buyerLines(input.order),
    "",
    "Item :",
    ...itemLines(input.order),
    "",
    `Total : Rp ${input.order.amount.toLocaleString("id-ID")}`,
  ]
    .filter((line): line is string => line != null)
    .join("\n");
}

/** Cash: local invoice + WA chat. */
export function buildCashWhatsAppMessage(input: {
  template: string;
  order: OrderMessageOrder;
}): string {
  return buildOrderWhatsAppMessage({
    intro: [input.template.trim()],
    payLabel: "Cash (Via WhatsApp)",
    order: input.order,
  });
}

/** After QRIS paid — confirm order to seller via WA. */
export function buildQrisPaidWhatsAppMessage(input: {
  order: OrderMessageOrder;
}): string {
  return buildOrderWhatsAppMessage({
    intro: ["Halo, saya sudah bayar via QRIS."],
    payLabel: "QRIS",
    statusLine: "Status : Paid",
    order: input.order,
  });
}
