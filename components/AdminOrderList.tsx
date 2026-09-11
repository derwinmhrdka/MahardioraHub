import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  ImageOff,
  Loader,
} from "lucide-react";
import { AdminOrderActions } from "@/components/AdminOrderActions";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import type { OrderListTab } from "@/lib/orders";
import styles from "./AdminOrderList.module.css";

type OrderItem = {
  id: number;
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
};

type OrderRow = {
  id: string;
  externalId: string;
  status: string;
  payMethod: string;
  amount: number;
  cancelReason: string | null;
  paymentProofUrl: string | null;
  buyerName: string;
  buyerWhatsapp: string;
  buyerAddress: string;
  createdAt: Date;
  paidAt: Date | null;
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  } | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
  items: OrderItem[];
};

type AdminOrderListProps = {
  orders: OrderRow[];
  activeTab: OrderListTab;
  progressCount: number;
  pendingCount: number;
  imageByProduct: Map<number, string | null>;
  notice?: string | null;
  noticeTone?: "ok" | "error";
  rejectFocusOrderId?: string | null;
};

const TABS: { id: OrderListTab; label: string; Icon: typeof Loader }[] = [
  { id: "pending", label: "Pending", Icon: Hourglass },
  { id: "progress", label: "Progress", Icon: Loader },
  { id: "completed", label: "Completed", Icon: CheckCircle2 },
  { id: "cancel", label: "Cancel", Icon: Ban },
];

function emptyLabel(tab: OrderListTab) {
  if (tab === "pending") return "Belum ada transfer menunggu";
  if (tab === "progress") return "Belum ada pesanan";
  if (tab === "completed") return "Belum ada completed";
  return "Belum ada cancel";
}

export function AdminOrderList({
  orders,
  activeTab,
  progressCount,
  pendingCount,
  imageByProduct,
  notice = null,
  noticeTone = "ok",
  rejectFocusOrderId = null,
}: AdminOrderListProps) {
  const EmptyIcon =
    TABS.find((t) => t.id === activeTab)?.Icon ?? ClipboardList;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Pesanan</h1>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Pesanan">
        {TABS.map(({ id, label, Icon }) => (
          <Link
            key={id}
            href={`/admin/orders?tab=${id}`}
            role="tab"
            aria-selected={activeTab === id}
            className={`${styles.tab} ${activeTab === id ? styles.tabOn : ""}`}
          >
            <Icon size={13} strokeWidth={2.25} aria-hidden />
            <span>{label}</span>
            {id === "progress" && progressCount > 0 ? (
              <span className={styles.badge} aria-label={`${progressCount}`}>
                {progressCount > 9 ? "9+" : progressCount}
              </span>
            ) : null}
            {id === "pending" && pendingCount > 0 ? (
              <span className={styles.badge} aria-label={`${pendingCount}`}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {notice ? (
        <p
          className={`${styles.notice} ${
            noticeTone === "error" ? styles.noticeError : ""
          }`}
        >
          {notice}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <EmptyIcon size={26} strokeWidth={1.75} aria-hidden />
          <p>{emptyLabel(activeTab)}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <p className={styles.inv}>{order.externalId}</p>
                  <p className={styles.buyer}>
                    {order.buyerName ||
                      order.user?.name ||
                      order.user?.email ||
                      "User"}
                  </p>
                  {order.buyerWhatsapp ? (
                    <p className={styles.buyerPhone}>{order.buyerWhatsapp}</p>
                  ) : null}
                  {order.payMethod === "bank_transfer" ? (
                    <p className={styles.payTag}>Transfer bank</p>
                  ) : null}
                </div>
                <p className={styles.amount}>{formatRupiah(order.amount)}</p>
              </div>

              {order.bankAccount ? (
                <p className={styles.bankInfo}>
                  {order.bankAccount.bankName} ·{" "}
                  {order.bankAccount.accountNumber}
                </p>
              ) : null}

              {order.paymentProofUrl ? (
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.proof}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.paymentProofUrl} alt="Bukti transfer" />
                  <span>Lihat bukti</span>
                </a>
              ) : activeTab === "pending" ? (
                <p className={styles.noProof}>Belum upload bukti</p>
              ) : null}

              {order.cancelReason ? (
                <p className={styles.reason}>{order.cancelReason}</p>
              ) : null}

              <ul className={styles.items}>
                {order.items.map((item) => {
                  const src = productImageUrl(
                    imageByProduct.get(item.productId) ?? null,
                    64
                  );
                  return (
                    <li key={item.id} className={styles.item}>
                      <div className={styles.thumb}>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" />
                        ) : (
                          <ImageOff size={12} strokeWidth={1.75} aria-hidden />
                        )}
                      </div>
                      <p className={styles.itemTitle}>{item.title}</p>
                      <p className={styles.itemQty}>x{item.quantity}</p>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.cardActions}>
                <Link href={`/orders/${order.id}`} className={styles.invoiceLink}>
                  Invoice
                </Link>
                {activeTab === "progress" ? (
                  <AdminOrderActions
                    orderId={order.id}
                    forceRejectOpen={rejectFocusOrderId === order.id}
                  />
                ) : null}
                {activeTab === "pending" ? (
                  <AdminOrderActions
                    orderId={order.id}
                    mode="bankPending"
                    canConfirm={Boolean(order.paymentProofUrl)}
                    forceRejectOpen={rejectFocusOrderId === order.id}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
