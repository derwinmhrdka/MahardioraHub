import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { auth } from "@/auth";
import { AdminOrderActions } from "@/components/AdminOrderActions";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { DownloadInvoiceButton } from "@/components/DownloadInvoiceButton";
import { Header } from "@/components/Header";
import { OpenWhatsAppOnce } from "@/components/OpenWhatsAppOnce";
import { OrderCountdown } from "@/components/OrderCountdown";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { getGuestId } from "@/lib/cart-owner";
import {
  buildCashWhatsAppMessage,
  cancelOwnerOrder,
  getOrderForViewer,
  type CheckoutOwner,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";
import { getSettings, orderPageUrl } from "@/lib/settings";
import styles from "../orders.module.css";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ contact?: string }>;
};

function statusLabel(status: string) {
  if (status === "paid") return "In Progress";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "failed") return "Failed";
  return "Pending";
}

function payMethodLabel(method: string) {
  if (method === "qris") return "QRIS";
  if (method === "bank_transfer") return "Transfer Bank";
  if (method === "cash") return "Cash (WhatsApp)";
  return method;
}

function backTab(status: string) {
  if (status === "pending") return "pending";
  if (status === "paid") return "progress";
  if (status === "completed") return "completed";
  return "cancel";
}

function formatDate(date: Date) {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sellerWhatsAppHref(input: {
  whatsappNumber: string;
  invoiceNo: string;
  orderId: string;
  amount: number;
  buyerName?: string;
  buyerWhatsapp?: string;
  buyerAddress?: string;
  shipFromBranch?: string | null;
}) {
  const link = orderPageUrl(input.orderId);
  const text = [
    "Halo, saya mau hubungi soal pesanan.",
    `Invoice : ${input.invoiceNo}`,
    `Total : Rp ${input.amount.toLocaleString("id-ID")}`,
    `Pesanan : ${link}`,
    input.buyerName ? `Nama : ${input.buyerName}` : null,
    input.buyerWhatsapp ? `WA : ${input.buyerWhatsapp}` : null,
    input.buyerAddress ? `Alamat : ${input.buyerAddress}` : null,
    input.shipFromBranch ? `Dikirim dari : ${input.shipFromBranch}` : null,
  ]
    .filter((line): line is string => line != null)
    .join("\n");
  return `https://wa.me/${input.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { orderId } = await params;
  const query = await searchParams;
  const session = await auth();
  const guestId = await getGuestId();
  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = Boolean(session?.user?.id);

  let order = await getOrderForViewer(orderId, {
    userId: session?.user?.id ?? null,
    guestId,
    isAdmin: Boolean(isAdmin),
  });
  if (!order) notFound();

  const isOwner =
    (session?.user?.id && order.userId === session.user.id) ||
    (guestId && order.guestId === guestId);

  if (
    isOwner &&
    order.status === "pending" &&
    order.expiresAt &&
    order.expiresAt.getTime() <= Date.now()
  ) {
    const owner: CheckoutOwner = {
      ownerKey: session?.user?.id
        ? `u_${session.user.id}`
        : `g_${guestId}`,
      userId: session?.user?.id ?? null,
      guestId: guestId,
    };
    await cancelOwnerOrder(order.id, owner);
    order = await getOrderForViewer(orderId, {
      userId: session?.user?.id ?? null,
      guestId,
      isAdmin: Boolean(isAdmin),
    });
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
  const isInvoice =
    order.status === "paid" || order.status === "completed";
  const showCashContact =
    Boolean(isOwner) &&
    order.payMethod === "cash" &&
    (isPending || isInvoice);
  const showPaidContact = isInvoice && Boolean(isOwner);
  const showContact = showCashContact || showPaidContact;
  const autoOpenContact = showCashContact && query.contact === "1";
  const expiresAt =
    order.expiresAt?.toISOString() ??
    new Date(order.createdAt.getTime() + 60 * 60 * 1000).toISOString();

  const waHref = showContact
    ? order.payMethod === "cash"
      ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
          buildCashWhatsAppMessage({
            template: settings.whatsappTemplate,
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
      : sellerWhatsAppHref({
          whatsappNumber: settings.whatsappNumber,
          invoiceNo: order.externalId,
          orderId: order.id,
          amount: order.amount,
          buyerName: order.buyerName,
          buyerWhatsapp: order.buyerWhatsapp,
          buyerAddress: order.buyerAddress,
          shipFromBranch: order.shipFromBranch,
        })
    : null;

  const backHref = isAdmin
    ? `/admin/orders?tab=${backTab(order.status)}`
    : isLoggedIn
      ? `/orders?tab=${backTab(order.status)}`
      : "/";

  return (
    <div className={`section-secondhand ${styles.invoicePage}`}>
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={`${styles.top} ${styles.noPrint}`}>
          <Link
            href={backHref}
            className={styles.back}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          </Link>
          <h1 className={styles.title}>Invoice</h1>
          <DownloadInvoiceButton className={styles.downloadBtn} />
        </div>

        {autoOpenContact && waHref ? <OpenWhatsAppOnce href={waHref} /> : null}

        <div className={styles.detail} id="invoice-receipt">
          <div className={styles.printBrand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.printLogo}
              src="/brand/mahardiora-hub.png"
              alt={settings.siteName}
              width={160}
              height={184}
            />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>{statusLabel(order.status)}</span>
              {isPending && isOwner ? (
                <span className={styles.noPrint}>
                  <OrderCountdown expiresAt={expiresAt} />
                </span>
              ) : null}
            </div>
            <div className={styles.invoiceMeta}>
              <p className={styles.invLabel}>No. Invoice</p>
              <p className={styles.invValue}>{order.externalId}</p>
              <dl className={styles.metaGrid}>
                <div>
                  <dt>Tanggal</dt>
                  <dd>{formatDate(order.createdAt)}</dd>
                </div>
                <div>
                  <dt>Pembayaran</dt>
                  <dd>{payMethodLabel(order.payMethod)}</dd>
                </div>
                {order.paidAt ? (
                  <div>
                    <dt>Dibayar</dt>
                    <dd>{formatDate(order.paidAt)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Nama</dt>
                  <dd>{order.buyerName}</dd>
                </div>
                <div>
                  <dt>WhatsApp</dt>
                  <dd>{order.buyerWhatsapp || "—"}</dd>
                </div>
                <div className={styles.metaWide}>
                  <dt>Alamat</dt>
                  <dd>{order.buyerAddress || "—"}</dd>
                </div>
                {order.shipFromBranch ? (
                  <div>
                    <dt>Dikirim dari</dt>
                    <dd>{order.shipFromBranch}</dd>
                  </div>
                ) : null}
                {order.bankAccount ? (
                  <div className={styles.metaWide}>
                    <dt>Rekening</dt>
                    <dd>
                      {order.bankAccount.bankName} ·{" "}
                      {order.bankAccount.accountNumber}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
            {order.cancelReason ? (
              <p className={styles.cancelReason}>{order.cancelReason}</p>
            ) : null}
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
                    <div className={styles.itemBody}>
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

          <div className={`${styles.actionStack} ${styles.noPrint}`}>
            {waHref ? (
              <a
                href={waHref}
                className={styles.waBtnBlock}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={16} />
                {order.payMethod === "cash"
                  ? "Konfirmasi via WhatsApp"
                  : "Hubungi Seller"}
              </a>
            ) : null}

            <DownloadInvoiceButton className={styles.downloadBtnBlock} />

            {isAdmin &&
            order.payMethod === "bank_transfer" &&
            order.paymentProofUrl ? (
              <div className={styles.panel}>
                <div className={styles.panelHead}>Bukti transfer</div>
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.proofLink}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.paymentProofUrl} alt="Bukti transfer" />
                </a>
              </div>
            ) : null}

            {isAdmin &&
            order.status === "paid" &&
            order.payMethod !== "bank_transfer" ? (
              <div className={styles.adminActions}>
                <AdminOrderActions orderId={order.id} fullWidth />
              </div>
            ) : null}

            {isAdmin &&
            order.status === "pending" &&
            order.payMethod === "bank_transfer" ? (
              <div className={styles.adminActions}>
                <AdminOrderActions
                  orderId={order.id}
                  mode="bankPending"
                  canConfirm={Boolean(order.paymentProofUrl)}
                  fullWidth
                />
              </div>
            ) : null}

            {isPending && isOwner ? (
              <div className={styles.actions}>
                {order.payMethod === "qris" ||
                order.payMethod === "bank_transfer" ? (
                  <Link href={`/checkout/${order.id}`} className={styles.btn}>
                    {order.payMethod === "bank_transfer" &&
                    order.paymentProofUrl
                      ? "Lihat bukti"
                      : "Bayar"}
                  </Link>
                ) : null}
                <CancelOrderButton orderId={order.id} />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
