"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  LogOut,
  Package,
  Settings,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import styles from "./AdminNav.module.css";

type AdminNavProps = {
  siteName: string;
  userImage?: string | null;
  userName?: string | null;
  progressCount?: number;
};

function navActive(pathname: string) {
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/products") || pathname === "/admin") {
    return "products";
  }
  return null;
}

export function AdminNav({
  siteName,
  userImage,
  userName,
  progressCount = 0,
}: AdminNavProps) {
  const pathname = usePathname();
  const active = navActive(pathname);
  const initial = (userName || "?").slice(0, 1).toUpperCase();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className={styles.top}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>{siteName}</span>
          <span className={styles.brandSub}>Admin</span>
        </div>
        <div className={styles.topRight} ref={rootRef}>
          <button
            type="button"
            className={`${styles.avatarBtn} ${open ? styles.avatarOn : ""}`}
            aria-label="Akun"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{initial}</span>
            )}
          </button>

          {open ? (
            <div className={styles.menu} role="menu">
              <p className={styles.roleLabel}>Admin</p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={styles.menuItem}
                  role="menuitem"
                >
                  <LogOut size={14} strokeWidth={2.25} aria-hidden />
                  Logout
                </button>
              </form>
            </div>
          ) : null}
        </div>
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
          href="/admin/orders"
          className={`${styles.tab} ${active === "orders" ? styles.tabOn : ""}`}
          aria-current={active === "orders" ? "page" : undefined}
        >
          <span className={styles.tabIcon}>
            <ClipboardList size={14} strokeWidth={2.25} aria-hidden />
            {progressCount > 0 ? (
              <span className={styles.badge} aria-label={`${progressCount} pesanan`}>
                {progressCount > 9 ? "9+" : progressCount}
              </span>
            ) : null}
          </span>
          <span>Pesanan</span>
        </Link>
        <Link
          href="/admin/settings"
          className={`${styles.tab} ${active === "settings" ? styles.tabOn : ""}`}
          aria-current={active === "settings" ? "page" : undefined}
        >
          <Settings size={14} strokeWidth={2.25} aria-hidden />
          <span>Settings</span>
        </Link>
        <Link href="/" className={styles.tab}>
          <Home size={14} strokeWidth={2.25} aria-hidden />
          <span>Site</span>
        </Link>
      </nav>
    </>
  );
}
