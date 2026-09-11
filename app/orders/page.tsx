import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  ImageOff,
  Loader,
} from "lucide-react";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { Header } from "@/components/Header";
import { OrderCountdown } from "@/components/OrderCountdown";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { resolveCartOwner } from "@/lib/cart-owner";
import {
  buyerEmptyCopy,
  orderStatusLabel,
  parseOrderListTab,
} from "@/lib/order-display";
import {
  countPendingOrdersForOwner,
  countProgressOrdersForOwner,
  listOrdersForOwner,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";
import { getSettings } from "@/lib/settings";
import styles from "./orders.module.css";

type PageProps = {
  searchParams: Promise<{ tab?: string; cancelled?: string }>;
};


export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const owner = await resolveCartOwner();
  if (!owner.userId) {
    redirect("/");
  }

  const tab = parseOrderListTab(params.tab);

  const [settings, orders, pendingCount, progressCount] = await Promise.all([
    getSettings(),
    listOrdersForOwner(owner, tab),
    countPendingOrdersForOwner(owner),
    countProgressOrdersForOwner(owner),
  ]);

  const productIds = [
    ...new Set(orders.flatMap((o) => o.items.map((i) => i.productId))),
  ];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, imageUrl: true, imageUrls: true },
        })
      : [];
  const imageByProduct = new Map(
    products.map((p) => [p.id, productImages(p)[0] ?? null])
  );

  const emptyIconByTab = {
    pending: Clock3,
    progress: Loader,
    completed: CheckCircle2,
    cancel: Ban,
  } as const;
  const emptyLabel = buyerEmptyCopy(tab);
  const EmptyIcon = emptyIconByTab[tab];

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.top}>
          <Link
            href="/"
            className={styles.back}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          </Link>
          <h1 className={styles.title}>Order</h1>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Order">
          <Link
            href="/orders?tab=pending"
            role="tab"
            aria-selected={tab === "pending"}
            className={`${styles.tab} ${tab === "pending" ? styles.tabOn : ""}`}
          >
            Pending
            {pendingCount > 0 ? (
              <span
                className={styles.badge}
                aria-label={`${pendingCount} pending`}
              >
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/orders?tab=progress"
            role="tab"
            aria-selected={tab === "progress"}
            className={`${styles.tab} ${tab === "progress" ? styles.tabOn : ""}`}
          >
            Progress
            {progressCount > 0 ? (
              <span
                className={styles.badge}
                aria-label={`${progressCount} in progress`}
              >
                {progressCount > 9 ? "9+" : progressCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/orders?tab=completed"
            role="tab"
            aria-selected={tab === "completed"}
            className={`${styles.tab} ${tab === "completed" ? styles.tabOn : ""}`}
          >
            Completed
          </Link>
          <Link
            href="/orders?tab=cancel"
            role="tab"
            aria-selected={tab === "cancel"}
            className={`${styles.tab} ${tab === "cancel" ? styles.tabOn : ""}`}
          >
            Cancel
          </Link>
        </div>

        {params.cancelled ? <p className={styles.note}>Cancelled</p> : null}

        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden>
              <EmptyIcon size={28} strokeWidth={1.75} />
            </span>
            <p className={styles.emptyLabel}>{emptyLabel}</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {orders.map((order) => {
              const expiresAt =
                order.expiresAt?.toISOString() ??
                new Date(
                  order.createdAt.getTime() + 60 * 60 * 1000
                ).toISOString();

              return (
                <li key={order.id} className={styles.card}>
                  <Link href={`/orders/${order.id}`} className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTopText}>
                        <p
                          className={`${styles.statusLine} ${
                            tab === "pending" ? styles.statusPending : ""
                          }`}
                        >
                          {orderStatusLabel(order.status)}
                        </p>
                        <p className={styles.invMini}>{order.externalId}</p>
                      </div>
                      {tab === "pending" ? (
                        <OrderCountdown expiresAt={expiresAt} />
                      ) : (
                        <span className={styles.amountMini}>
                          {formatRupiah(order.amount)}
                        </span>
                      )}
                    </div>
                    {order.cancelReason ? (
                      <p className={styles.cancelReason}>{order.cancelReason}</p>
                    ) : null}
                    <ul className={styles.products}>
                      {order.items.map((item) => {
                        const src = productImageUrl(
                          imageByProduct.get(item.productId) ?? null,
                          72
                        );
                        return (
                          <li key={item.id} className={styles.productRow}>
                            <div className={styles.thumb}>
                              {src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={src} alt="" />
                              ) : (
                                <ImageOff
                                  size={14}
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                              )}
                            </div>
                            <p className={styles.productTitle}>{item.title}</p>
                            <p className={styles.productQty}>
                              x{item.quantity}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    <div className={styles.cardFoot}>
                      <span className={styles.meta}>Total</span>
                      <span className={styles.amount}>
                        {formatRupiah(order.amount)}
                      </span>
                    </div>
                  </Link>

                  <div className={styles.actions}>
                    <Link
                      href={`/orders/${order.id}`}
                      className={styles.btnGhost}
                    >
                      Invoice
                    </Link>
                    {tab === "pending" ? (
                      <>
                        {order.payMethod === "qris" ||
                        order.payMethod === "bank_transfer" ? (
                          <Link
                            href={`/checkout/${order.id}`}
                            className={styles.btn}
                          >
                            {order.payMethod === "bank_transfer" &&
                            order.paymentProofUrl
                              ? "Bukti"
                              : "Bayar"}
                          </Link>
                        ) : null}
                        <CancelOrderButton orderId={order.id} />
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
