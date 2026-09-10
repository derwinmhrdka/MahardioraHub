import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { auth } from "@/auth";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { Header } from "@/components/Header";
import { OrderCountdown } from "@/components/OrderCountdown";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { getOrderForUser } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";
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

function backTab(status: string) {
  if (status === "pending") return "pending";
  if (status === "paid") return "completed";
  return "cancel";
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/orders");
  }

  const { orderId } = await params;
  let order = await getOrderForUser(orderId, session.user.id);
  if (!order) notFound();

  // Auto-expire overdue pending before showing
  if (
    order.status === "pending" &&
    order.expiresAt &&
    order.expiresAt.getTime() <= Date.now()
  ) {
    const { cancelUserOrder } = await import("@/lib/orders");
    await cancelUserOrder(order.id, session.user.id);
    order = await getOrderForUser(orderId, session.user.id);
    if (!order) notFound();
  }

  const settings = await getSettings();
  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map((i) => i.productId) } },
    select: { id: true, imageUrl: true, imageUrls: true },
  });
  const imageByProduct = new Map(
    products.map((p) => [p.id, productImages(p)[0] ?? null])
  );

  const isPending = order.status === "pending";
  const expiresAt =
    order.expiresAt?.toISOString() ??
    new Date(order.createdAt.getTime() + 60 * 60 * 1000).toISOString();

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.top}>
          <Link
            href={`/orders?tab=${backTab(order.status)}`}
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
            <div className={styles.panelHead}>
              <span>{statusLabel(order.status)}</span>
              {isPending ? <OrderCountdown expiresAt={expiresAt} /> : null}
            </div>
            <p className={styles.inv}>{order.externalId}</p>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>Item</div>
            <ul className={styles.items}>
              {order.items.map((item) => {
                const src = productImageUrl(
                  imageByProduct.get(item.productId) ?? null,
                  96
                );
                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.thumb}>
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" />
                      ) : (
                        <ImageOff size={14} strokeWidth={1.75} aria-hidden />
                      )}
                    </div>
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
                );
              })}
            </ul>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{formatRupiah(order.amount)}</span>
            </div>
          </div>

          {isPending ? (
            <div className={styles.actions}>
              {order.payMethod === "qris" ? (
                <Link href={`/checkout/${order.id}`} className={styles.btn}>
                  Bayar
                </Link>
              ) : null}
              <CancelOrderButton orderId={order.id} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
