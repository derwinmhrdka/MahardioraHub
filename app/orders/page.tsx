import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  ImageOff,
  PackageOpen,
} from "lucide-react";
import { auth } from "@/auth";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { Header } from "@/components/Header";
import { OrderCountdown } from "@/components/OrderCountdown";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import {
  countPendingOrders,
  listOrdersForUser,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";
import { getSettings } from "@/lib/settings";
import styles from "./orders.module.css";

type Tab = "pending" | "completed" | "cancel";

type PageProps = {
  searchParams: Promise<{ tab?: string; cancelled?: string }>;
};

function parseTab(raw: string | undefined): Tab {
  if (raw === "completed" || raw === "selesai") return "completed";
  if (raw === "cancel" || raw === "cancelled") return "cancel";
  if (raw === "payment") return "pending";
  return "pending";
}

function emptyCopy(tab: Tab) {
  if (tab === "pending") {
    return {
      label: "Belum ada payment",
      Icon: Clock3,
    };
  }
  if (tab === "completed") {
    return {
      label: "Belum ada completed",
      Icon: CheckCircle2,
    };
  }
  return {
    label: "Belum ada cancel",
    Icon: Ban,
  };
}

function statusMeta(status: string) {
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "failed") return "Failed";
  return "Menunggu pembayaran";
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/orders");
  }

  const params = await searchParams;
  const tab = parseTab(params.tab);
  const userId = session.user.id;

  const [settings, orders, pendingCount] = await Promise.all([
    getSettings(),
    listOrdersForUser(userId, tab),
    countPendingOrders(userId),
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

  const empty = emptyCopy(tab);
  const EmptyIcon = empty.Icon;

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.top}>
          <Link
            href="/secondhand"
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
            <p className={styles.emptyLabel}>{empty.label}</p>
            {tab === "pending" ? (
              <Link href="/secondhand" className={styles.emptyCta}>
                <PackageOpen size={14} strokeWidth={2.25} aria-hidden />
                Secondhand
              </Link>
            ) : null}
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
                      <p
                        className={`${styles.statusLine} ${
                          tab === "pending" ? styles.statusPending : ""
                        }`}
                      >
                        {statusMeta(order.status)}
                      </p>
                      {tab === "pending" ? (
                        <OrderCountdown expiresAt={expiresAt} />
                      ) : (
                        <span className={styles.amountMini}>
                          {formatRupiah(order.amount)}
                        </span>
                      )}
                    </div>
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
                    {tab === "pending" ? (
                      <>
                        {order.payMethod === "qris" ? (
                          <Link
                            href={`/checkout/${order.id}`}
                            className={styles.btn}
                          >
                            Bayar
                          </Link>
                        ) : null}
                        <CancelOrderButton orderId={order.id} />
                      </>
                    ) : (
                      <Link
                        href={`/orders/${order.id}`}
                        className={styles.btnGhost}
                      >
                        {order.status === "paid" ? "Invoice" : "Detail"}
                      </Link>
                    )}
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
