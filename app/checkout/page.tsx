import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { PaymentMethods } from "@/components/PaymentMethods";
import { listCartItems } from "@/lib/cart";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { productImages } from "@/lib/product-images";
import { salePrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { xenditConfigured } from "@/lib/xendit";
import styles from "./checkout.module.css";

export default async function CheckoutPaymentPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/checkout");
  }

  const [settings, rows] = await Promise.all([
    getSettings(),
    listCartItems(session.user.id),
  ]);

  if (rows.length === 0) {
    redirect("/secondhand");
  }

  const items = rows.map((row) => {
    const unit = salePrice(row.product.price, row.product.discountPercent);
    return {
      productId: row.productId,
      title: row.product.title,
      quantity: row.quantity,
      unit,
      imageUrl: productImages(row.product)[0] ?? null,
      line: unit * row.quantity,
    };
  });
  const total = items.reduce((sum, item) => sum + item.line, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

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
          <h1 className={styles.title}>Payment</h1>
        </div>

        <section className={styles.panel} aria-label="Order">
          <div className={styles.panelHead}>
            <span>Order</span>
            <span className={styles.count}>{count}</span>
          </div>
          <ul className={styles.summary}>
            {items.map((item) => {
              const src = productImageUrl(item.imageUrl, 72);
              return (
                <li key={item.productId} className={styles.row}>
                  <div className={styles.thumb}>
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className={styles.meta}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemSub}>x{item.quantity}</p>
                  </div>
                  <p className={styles.line}>{formatRupiah(item.line)}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.panel} aria-label="Bayar">
          <div className={styles.panelHead}>
            <span>Bayar</span>
          </div>
          <PaymentMethods xenditEnabled={xenditConfigured()} />
        </section>

        <div className={styles.bar}>
          <div className={styles.barMeta}>
            <span className={styles.barLabel}>Total</span>
            <span className={styles.barTotal}>{formatRupiah(total)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
