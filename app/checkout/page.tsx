import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { CheckoutBuyerForm } from "@/components/CheckoutBuyerForm";
import { listSelectedCartItems } from "@/lib/cart";
import { resolveCartOwner } from "@/lib/cart-owner";
import { getUserBuyerProfile } from "@/lib/buyer";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { productImages } from "@/lib/product-images";
import { salePrice } from "@/lib/pricing";
import { countActiveBankAccounts } from "@/lib/bank-accounts";
import { getCheckoutBranches } from "@/lib/branches";
import { getSettings } from "@/lib/settings";
import {
  getActivePendingBankTransferOrder,
  getActivePendingQrisOrder,
} from "@/lib/orders";
import { qrisConfigured } from "@/lib/qris-provider";
import styles from "./checkout.module.css";

export default async function CheckoutPaymentPage() {
  const owner = await resolveCartOwner();

  const [settings, rows, pendingQris, pendingTransfer, bankCount, profile, branches] =
    await Promise.all([
      getSettings(),
      listSelectedCartItems(owner.ownerKey),
      getActivePendingQrisOrder(owner),
      getActivePendingBankTransferOrder(owner),
      countActiveBankAccounts(),
      owner.userId ? getUserBuyerProfile(owner.userId) : Promise.resolve(null),
      getCheckoutBranches(),
    ]);

  // Cart kosong: lanjutkan pembayaran pending jika ada
  if (rows.length === 0) {
    if (pendingQris) redirect(`/checkout/${pendingQris.id}`);
    if (pendingTransfer) redirect(`/checkout/${pendingTransfer.id}`);
    redirect("/");
  }

  const qrisOk = await qrisConfigured();

  const pendingOrder = pendingQris ?? pendingTransfer;

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
            href="/"
            className={styles.back}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          </Link>
          <h1 className={styles.title}>Payment</h1>
        </div>

        {pendingOrder ? (
          <p className={styles.pendingNote}>
            Ada pembayaran pending.{" "}
            <Link href={`/checkout/${pendingOrder.id}`}>Lanjutkan</Link>
            {owner.userId ? (
              <>
                {" · "}
                <Link href="/orders?tab=pending">Lihat orders</Link>
              </>
            ) : (
              <>
                {" · "}
                <Link href={`/orders/${pendingOrder.id}`}>Invoice</Link>
              </>
            )}
          </p>
        ) : null}

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

        <CheckoutBuyerForm
          qrisEnabled={qrisOk}
          bankTransferEnabled={bankCount > 0}
          branches={branches.map((branch) => ({
            id: branch.id,
            name: branch.name,
          }))}
          initialBuyer={{
            name: profile?.name ?? "",
            whatsapp: profile?.whatsapp ?? "",
            address: profile?.address ?? "",
          }}
        />

        <div className={styles.barSpacer} aria-hidden />

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
