import type { OrderListTab } from "@/lib/orders/types";

export function parseOrderListTab(raw: string | undefined): OrderListTab {
  if (raw === "progress" || raw === "in-progress") return "progress";
  if (raw === "completed" || raw === "selesai") return "completed";
  if (raw === "cancel" || raw === "cancelled") return "cancel";
  if (raw === "payment") return "pending";
  return "pending";
}

/** Admin orders default to Progress tab. */
export function parseAdminOrderListTab(raw: string | undefined): OrderListTab {
  if (raw === "pending") return "pending";
  if (raw === "completed") return "completed";
  if (raw === "cancel" || raw === "cancelled") return "cancel";
  return "progress";
}

type OrderDisplayOpts = {
  payMethod?: string | null;
  hasPaymentProof?: boolean;
};

/** Bank transfer with proof is treated as in-progress for the buyer. */
export function isBuyerBankInReview(
  status: string,
  opts?: OrderDisplayOpts
): boolean {
  return (
    status === "pending" &&
    opts?.payMethod === "bank_transfer" &&
    Boolean(opts?.hasPaymentProof)
  );
}

/** Buyer-facing status text (list + detail). */
export function orderStatusLabel(
  status: string,
  opts?: OrderDisplayOpts
): string {
  if (isBuyerBankInReview(status, opts) || status === "paid") {
    return "In Progress";
  }
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "failed") return "Failed";
  return "Menunggu pembayaran";
}

/** Slightly shorter pending label for order detail header. */
export function orderStatusLabelShort(
  status: string,
  opts?: OrderDisplayOpts
): string {
  if (isBuyerBankInReview(status, opts)) return "In Progress";
  if (status === "pending") return "Pending";
  return orderStatusLabel(status, opts);
}

export function payMethodLabel(method: string): string {
  if (method === "qris") return "QRIS";
  if (method === "bank_transfer") return "Transfer Bank";
  if (method === "cash") return "Cash (WhatsApp)";
  return method;
}

/** Map order status → list tab query value. */
export function orderBackTab(
  status: string,
  opts?: OrderDisplayOpts & { forAdmin?: boolean }
): OrderListTab {
  if (!opts?.forAdmin && isBuyerBankInReview(status, opts)) {
    return "progress";
  }
  if (status === "pending") return "pending";
  if (status === "paid") return "progress";
  if (status === "completed") return "completed";
  return "cancel";
}

/** Invoice PDF/print is for active or finished orders, not cancelled ones. */
export function canDownloadInvoice(status: string): boolean {
  return (
    status === "pending" || status === "paid" || status === "completed"
  );
}

export function formatOrderDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buyerEmptyCopy(tab: OrderListTab): string {
  if (tab === "pending") return "Belum ada pending";
  if (tab === "progress") return "Belum ada in progress";
  if (tab === "completed") return "Belum ada completed";
  return "Belum ada cancel";
}

export function adminEmptyCopy(tab: OrderListTab): string {
  if (tab === "pending") return "Belum ada transfer menunggu";
  if (tab === "progress") return "Belum ada pesanan";
  if (tab === "completed") return "Belum ada completed";
  return "Belum ada cancel";
}
