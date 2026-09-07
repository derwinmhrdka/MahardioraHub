import Link from "next/link";
import { Package, Recycle } from "lucide-react";
import styles from "./Header.module.css";

type HeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

export function Header({ active = "deals" }: HeaderProps) {
  const subtitle = active === "secondhand" ? "Second Stuff" : "Product Hub";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={active === "secondhand" ? "/secondhand" : "/"} className={styles.brand}>
          <span className={styles.brandName}>Mahardiora</span>
          <span className={styles.brandSub}>{subtitle}</span>
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link
            href="/"
            aria-current={active === "deals" ? "page" : undefined}
          >
            <Package size={12} strokeWidth={2} aria-hidden />
            Deals
          </Link>
          <Link
            href="/secondhand"
            aria-current={active === "secondhand" ? "page" : undefined}
          >
            <Recycle size={12} strokeWidth={2} aria-hidden />
            Used
          </Link>
        </nav>
      </div>
    </header>
  );
}
