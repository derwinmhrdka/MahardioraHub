import Link from "next/link";
import { ExternalLink, FolderTree, LogOut, Package, Settings } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import styles from "./AdminNav.module.css";

type AdminNavProps = {
  siteName: string;
  active?: "products" | "categories" | "settings";
};

export function AdminNav({ siteName, active }: AdminNavProps) {
  return (
    <>
      <div className={styles.top}>
        <span className={styles.brand}>{siteName}</span>
        <form action={logoutAction}>
          <button type="submit" className="btn-icon" title="Log out" aria-label="Log out">
            <LogOut size={16} strokeWidth={2} />
          </button>
        </form>
      </div>
      <nav className={styles.nav} aria-label="Admin">
        <Link
          href="/admin/products"
          aria-current={active === "products" ? "page" : undefined}
        >
          <Package size={15} strokeWidth={2} aria-hidden />
          Products
        </Link>
        <Link
          href="/admin/categories"
          aria-current={active === "categories" ? "page" : undefined}
        >
          <FolderTree size={15} strokeWidth={2} aria-hidden />
          Categories
        </Link>
        <Link
          href="/admin/settings"
          aria-current={active === "settings" ? "page" : undefined}
        >
          <Settings size={15} strokeWidth={2} aria-hidden />
          Settings
        </Link>
        <Link href="/">
          <ExternalLink size={15} strokeWidth={2} aria-hidden />
          Site
        </Link>
      </nav>
    </>
  );
}
