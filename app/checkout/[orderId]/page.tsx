import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BankTransferCheckout } from "@/components/BankTransferCheckout";
import { Header } from "@/components/Header";
import { QrisCheckout } from "@/components/QrisCheckout";
import { listActiveBankAccounts } from "@/lib/bank-accounts";
import { resolveCartOwner } from "@/lib/cart-owner";
import { getOrderForOwner } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { qrisCanSimulate } from "@/lib/qris-provider";
import styles from "../checkout.module.css";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutOrderPage({ params }: PageProps) {
  const { orderId } = await params;
  const owner = await resolveCartOwner();
  const order = await getOrderForOwner(orderId, owner);
  if (!order) notFound();
  if (order.payMethod !== "qris" && order.payMethod !== "bank_transfer") {
    notFound();
  }

  if (order.status === "paid" || order.status === "completed") {
    redirect(`/checkout/success?order=${order.id}`);
  }

  if (
    order.status === "cancelled" ||
    order.status === "expired" ||
    order.status === "failed"
  ) {
    redirect(`/orders/${order.id}`);
  }

  if (order.status !== "pending") notFound();

  if (order.payMethod === "qris" && !order.qrString) notFound();

  const [settings, accounts] = await Promise.all([
    getSettings(),
    order.payMethod === "bank_transfer"
      ? listActiveBankAccounts()
      : Promise.resolve([]),
  ]);

  const title = order.payMethod === "qris" ? "QRIS" : "Transfer Bank";

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.top}>
          <Link
            href="/orders?tab=pending"
            className={styles.back}
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
          </Link>
          <h1 className={styles.title}>{title}</h1>
        </div>

        {order.payMethod === "qris" && order.qrString ? (
          <QrisCheckout
            orderId={order.id}
            externalId={order.externalId}
            amount={order.amount}
            qrString={order.qrString}
            expiresAt={
              order.expiresAt?.toISOString() ??
              new Date(order.createdAt.getTime() + 60 * 60 * 1000).toISOString()
            }
            initialStatus="pending"
            canSimulate={qrisCanSimulate(order.payProvider)}
          />
        ) : accounts.length === 0 ? (
          <p className={styles.emptyPay}>
            Belum ada rekening aktif. Hubungi admin atau pilih metode lain.
          </p>
        ) : (
          <BankTransferCheckout
            orderId={order.id}
            externalId={order.externalId}
            amount={order.amount}
            accounts={accounts.map((a) => ({
              id: a.id,
              bankName: a.bankName,
              accountName: a.accountName,
              accountNumber: a.accountNumber,
            }))}
            initialBankAccountId={order.bankAccountId}
            initialProofUrl={order.paymentProofUrl}
          />
        )}
      </main>
    </div>
  );
}
