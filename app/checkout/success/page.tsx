import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { PaymentSuccessMark } from "@/components/PaymentSuccessMark";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { formatRupiah } from "@/lib/format";
import {
  buildQrisPaidWhatsAppMessage,
  getOrderByExternalId,
  getOrderForUser,
} from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import styles from "../checkout.module.css";

type PageProps = {
  searchParams: Promise<{ order?: string; ext?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const settings = await getSettings();
  const session = await auth();

  let order =
    params.order && session?.user?.id
      ? await getOrderForUser(params.order, session.user.id)
      : params.ext
        ? await getOrderByExternalId(params.ext)
        : null;

  if (order && session?.user?.id && order.userId !== session.user.id) {
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
              <Link href={`/orders/${order.id}`} className={styles.linkGhost}>
                Invoice
              </Link>
            ) : null}
            <Link href="/secondhand" className={styles.link}>
              Secondhand
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
