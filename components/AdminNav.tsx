"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  LogOut,
  Package,
  Settings,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import styles from "./AdminNav.module.css";

type AdminNavProps = {
  siteName: string;
};

function navActive(pathname: string) {
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/products") || pathname === "/admin") {
    return "products";
  }
  return null;
}

export function AdminNav({ siteName }: AdminNavProps) {
  const pathname = usePathname();
  const active = navActive(pathname);

  return (
    <>
      <header className={styles.top}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>{siteName}</span>
          <span className={styles.brandSub}>Admin</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className={styles.logout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </form>
      </header>

      <nav className={styles.bottom} aria-label="Admin Menu">
        <Link
          href="/admin/products"
          className={`${styles.tab} ${active === "products" ? styles.tabOn : ""}`}
          aria-current={active === "products" ? "page" : undefined}
        >
          <Package size={14} strokeWidth={2.25} aria-hidden />
          <span>Produk</span>
        </Link>
        <Link
          href="/admin/settings"
          className={`${styles.tab} ${active === "settings" ? styles.tabOn : ""}`}
          aria-current={active === "settings" ? "page" : undefined}
        >
          <Settings size={14} strokeWidth={2.25} aria-hidden />
          <span>Settings</span>
        </Link>
        <Link
          href="/"
          className={styles.tab}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={14} strokeWidth={2.25} aria-hidden />
          <span>Site</span>
        </Link>
      </nav>
    </>
  );
}
