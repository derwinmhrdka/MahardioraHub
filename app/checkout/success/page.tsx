import Link from "next/link";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { formatRupiah } from "@/lib/format";
import { getOrderByExternalId, getOrderForUser } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import styles from "../checkout.module.css";

type PageProps = {
  searchParams: Promise<{ order?: string; ext?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const settings = await getSettings();
  const session = await auth();

  let amount: number | null = null;
  if (params.order && session?.user?.id) {
    const order = await getOrderForUser(params.order, session.user.id);
    amount = order?.amount ?? null;
  } else if (params.ext) {
    const order = await getOrderByExternalId(params.ext);
    amount = order?.amount ?? null;
  }

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.card}>
          <p>Success</p>
          {amount != null ? <p>{formatRupiah(amount)}</p> : null}
          <Link href="/secondhand" className={styles.link}>
            Secondhand
          </Link>
        </div>
      </main>
    </div>
  );
}
