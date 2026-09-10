import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { formatRupiah } from "@/lib/format";
import { listOrdersForUser } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { cancelOrderAction } from "./actions";
import styles from "./orders.module.css";

type PageProps = {
  searchParams: Promise<{ tab?: string; cancelled?: string }>;
};

function statusLabel(status: string) {
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "failed") return "Failed";
  return "Pending";
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/orders");
  }

  const params = await searchParams;
  const tab = params.tab === "selesai" ? "selesai" : "payment";
  const [settings, orders] = await Promise.all([
    getSettings(),
    listOrdersForUser(session.user.id, tab),
  ]);

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
            href="/orders?tab=payment"
            role="tab"
            aria-selected={tab === "payment"}
            className={`${styles.tab} ${tab === "payment" ? styles.tabOn : ""}`}
          >
            Payment
          </Link>
          <Link
            href="/orders?tab=selesai"
            role="tab"
            aria-selected={tab === "selesai"}
            className={`${styles.tab} ${tab === "selesai" ? styles.tabOn : ""}`}
          >
            Selesai
          </Link>
        </div>

        {params.cancelled ? <p className={styles.note}>Cancelled</p> : null}

        {orders.length === 0 ? (
          <p className={styles.empty}>—</p>
        ) : (
          <ul className={styles.list}>
            {orders.map((order) => (
              <li key={order.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <p className={styles.amount}>{formatRupiah(order.amount)}</p>
                  <p className={styles.meta}>{statusLabel(order.status)}</p>
                </div>
                <p className={styles.inv}>{order.externalId}</p>
                <p className={styles.meta}>
                  {order.payMethod === "qris" ? "QRIS" : "Cash"} ·{" "}
                  {order.items.length} item
                </p>
                <div className={styles.actions}>
                  {order.status === "pending" && order.payMethod === "qris" ? (
                    <Link
                      href={`/checkout/${order.id}`}
                      className={styles.btn}
                    >
                      Bayar
                    </Link>
                  ) : null}
                  {order.status === "pending" ? (
                    <form action={cancelOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button type="submit" className={styles.btnDanger}>
                        Cancel
                      </button>
                    </form>
                  ) : null}
                  {order.status !== "pending" ? (
                    <Link
                      href={`/orders/${order.id}`}
                      className={styles.btnGhost}
                    >
                      {order.status === "paid" ? "Invoice" : "Detail"}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
