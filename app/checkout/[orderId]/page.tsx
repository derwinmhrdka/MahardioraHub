import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { QrisCheckout } from "@/components/QrisCheckout";
import { getOrderForUser } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import styles from "../checkout.module.css";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutQrisPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/secondhand");
  }

  const { orderId } = await params;
  const order = await getOrderForUser(orderId, session.user.id);
  if (!order || order.payMethod !== "qris") notFound();

  if (order.status === "paid") {
    redirect(`/checkout/success?order=${order.id}`);
  }

  if (!order.qrString) notFound();

  const settings = await getSettings();

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <Link
          href="/secondhand"
          className={styles.back}
          aria-label="Kembali"
          title="Kembali"
        >
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
        </Link>
        <h1 className={styles.title}>QRIS</h1>
        <QrisCheckout
          orderId={order.id}
          amount={order.amount}
          qrString={order.qrString}
          expiresAt={order.expiresAt?.toISOString() ?? null}
          initialStatus={order.status}
        />
      </main>
    </div>
  );
}
