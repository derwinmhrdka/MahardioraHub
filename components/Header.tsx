import Link from "next/link";
import { Package, Recycle } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import styles from "./Header.module.css";

type HeaderProps = {
  siteName?: string;
  active?: "deals" | "secondhand";
};

export async function Header({ active = "deals" }: HeaderProps) {
  const subtitle = active === "secondhand" ? "Second Stuff" : "Product Hub";
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href={active === "secondhand" ? "/secondhand" : "/"}
          className={styles.brand}
        >
          <span className={styles.brandName}>Mahardiora</span>
          <span className={styles.brandSub}>{subtitle}</span>
        </Link>
        <div className={styles.right}>
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
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
