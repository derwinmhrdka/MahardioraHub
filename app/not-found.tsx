import Link from "next/link";
import { Home } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getSettings } from "@/lib/settings";
import styles from "./not-found.module.css";

export default async function NotFound() {
  let siteName = "MahardioraHub";
  try {
    const settings = await getSettings();
    siteName = settings.siteName;
  } catch {
    // keep fallback
  }

  return (
    <div className="section-secondhand">
      <SiteHeader siteName={siteName} active="secondhand" />
      <main className={`container ${styles.main}`}>
        <div className={styles.card}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Halaman tidak ditemukan</h1>
          <Link href="/" className={styles.homeBtn}>
            <Home size={16} strokeWidth={2.5} aria-hidden />
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
