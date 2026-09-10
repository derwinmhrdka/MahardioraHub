import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
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
  amount: number;
  cancelReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
  user: {
    name: string | null;
    email: string | null;
  };
  items: OrderItem[];
};

type AdminOrderListProps = {
  orders: OrderRow[];
  activeTab: OrderListTab;
  progressCount: number;
  imageByProduct: Map<number, string | null>;
  notice?: string | null;
  noticeTone?: "ok" | "error";
  rejectFocusOrderId?: string | null;
};

const TABS: { id: OrderListTab; label: string; Icon: typeof Loader }[] = [
  { id: "progress", label: "Progress", Icon: Loader },
  { id: "completed", label: "Completed", Icon: CheckCircle2 },
  { id: "cancel", label: "Cancel", Icon: Ban },
];

function emptyLabel(tab: OrderListTab) {
  if (tab === "progress") return "Belum ada pesanan";
  if (tab === "completed") return "Belum ada completed";
  return "Belum ada cancel";
}

export function AdminOrderList({
  orders,
  activeTab,
  progressCount,
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
                    {order.user.name || order.user.email || "User"}
                  </p>
                </div>
                <p className={styles.amount}>{formatRupiah(order.amount)}</p>
              </div>

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

              {activeTab === "progress" ? (
                <AdminOrderActions
                  orderId={order.id}
                  forceRejectOpen={rejectFocusOrderId === order.id}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
