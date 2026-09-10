import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { formatRupiah } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import styles from "../orders.module.css";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

function statusLabel(status: string) {
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "failed") return "Failed";
  return "Pending";
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/orders");
  }

  const { orderId } = await params;
  const order = await getOrderForUser(orderId, session.user.id);
  if (!order) notFound();

  if (order.status === "pending" && order.payMethod === "qris") {
    redirect(`/checkout/${order.id}`);
  }

  const settings = await getSettings();
  const backTab = order.status === "pending" ? "payment" : "selesai";

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.top}>
          <Link
            href={`/orders?tab=${backTab}`}
            className={styles.back}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          </Link>
          <h1 className={styles.title}>
            {order.status === "paid" ? "Invoice" : "Order"}
          </h1>
        </div>

        <div className={styles.detail}>
          <div className={styles.panel}>
            <div className={styles.panelHead}>Info</div>
            <div className={styles.item}>
              <div>
                <p className={styles.itemTitle}>{statusLabel(order.status)}</p>
                <p className={styles.itemSub}>{order.externalId}</p>
                <p className={styles.itemSub}>
                  {order.payMethod === "qris" ? "QRIS" : "Cash"}
                  {order.paidAt
                    ? ` · ${order.paidAt.toLocaleString("id-ID")}`
                    : ` · ${order.createdAt.toLocaleString("id-ID")}`}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>Item</div>
            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemSub}>
                      x{item.quantity} · {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <p className={styles.itemPrice}>
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{formatRupiah(order.amount)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
