import Link from "next/link";
import { Header } from "@/components/Header";
import { getSettings } from "@/lib/settings";
import styles from "../checkout.module.css";

export default async function CheckoutFailedPage() {
  const settings = await getSettings();

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.card}>
          <p>Failed</p>
          <Link href="/orders?tab=cancel" className={styles.link}>
            Order
          </Link>
        </div>
      </main>
    </div>
  );
}
