import Link from "next/link";
import { Header } from "@/components/Header";
import { PaymentSuccessMark } from "@/components/PaymentSuccessMark";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { formatRupiah } from "@/lib/format";
import { resolveCartOwner } from "@/lib/cart-owner";
import {
  buildQrisPaidWhatsAppMessage,
  getOrderByExternalId,
  getOrderForOwner,
} from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import styles from "../checkout.module.css";

type PageProps = {
  searchParams: Promise<{ order?: string; ext?: string }>;
};

function ownsOrder(
  order: { userId: string | null; guestId: string | null },
  owner: { userId: string | null; guestId: string | null }
) {
  if (owner.userId && order.userId === owner.userId) return true;
  if (owner.guestId && order.guestId === owner.guestId) return true;
  return false;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const settings = await getSettings();
  const owner = await resolveCartOwner();

  let order = params.order
    ? await getOrderForOwner(params.order, owner)
    : params.ext
      ? await getOrderByExternalId(params.ext)
      : null;

  if (order && params.ext && !ownsOrder(order, owner)) {
    order = null;
  }

  const amount = order?.amount ?? null;
  const showWaConfirm = order?.payMethod === "qris" && order.status === "paid";

  const waHref =
    showWaConfirm && order
      ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
          buildQrisPaidWhatsAppMessage({
            order: {
              id: order.id,
              externalId: order.externalId,
              amount: order.amount,
              buyerName: order.buyerName,
              buyerWhatsapp: order.buyerWhatsapp,
              buyerAddress: order.buyerAddress,
              shipFromBranch: order.shipFromBranch,
              items: order.items.map((item) => ({
                productId: item.productId,
                title: item.title,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
          })
        )}`
      : null;

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.card}>
          <PaymentSuccessMark
            amountLabel={amount != null ? formatRupiah(amount) : null}
          />
          <div className={styles.cardActions}>
            {waHref ? (
              <a href={waHref} className={styles.waBtn}>
                <WhatsAppIcon size={16} />
                Konfirmasi
              </a>
            ) : null}
            {order ? (
              <Link href={`/orders/${order.id}`} className={styles.link}>
                Invoice
              </Link>
            ) : (
              <Link href="/" className={styles.link}>
                Home
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
