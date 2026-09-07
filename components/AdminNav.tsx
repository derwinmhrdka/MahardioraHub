"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderTree,
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
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/products") || pathname === "/admin") {
    return "products";
  }
  return null;
}

function iconStroke(active: boolean) {
  return active ? 2.25 : 1.75;
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
            <LogOut size={12} strokeWidth={2} aria-hidden />
            <span>Logout</span>
          </button>
        </form>
      </header>

      <nav className={styles.bottom} aria-label="Admin Menu">
        <Link
          href="/admin/products"
          className={styles.tab}
          aria-current={active === "products" ? "page" : undefined}
        >
          <Package
            size={12}
            strokeWidth={iconStroke(active === "products")}
            aria-hidden
          />
          <span>Produk</span>
        </Link>
        <Link
          href="/admin/categories"
          className={styles.tab}
          aria-current={active === "categories" ? "page" : undefined}
        >
          <FolderTree
            size={12}
            strokeWidth={iconStroke(active === "categories")}
            aria-hidden
          />
          <span>Kategori</span>
        </Link>
        <Link
          href="/admin/settings"
          className={styles.tab}
          aria-current={active === "settings" ? "page" : undefined}
        >
          <Settings
            size={12}
            strokeWidth={iconStroke(active === "settings")}
            aria-hidden
          />
          <span>Settings</span>
        </Link>
        <Link href="/" className={styles.tab} target="_blank" rel="noreferrer">
          <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
          <span>Site</span>
        </Link>
      </nav>
    </>
  );
}
