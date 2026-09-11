"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Receipt, Shield } from "lucide-react";
import { signOutAction } from "@/app/login/actions";
import styles from "./UserMenu.module.css";

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "admin" | "visitor";
};

type UserMenuProps = {
  user: HeaderUser | null;
};

export function UserMenu({ user }: UserMenuProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const loginHref =
    pathname.startsWith("/login")
      ? "/login"
      : `/login?next=${encodeURIComponent(pathname)}`;

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

  if (!user) {
    return (
      <div className={styles.guestRow}>
        <Link
          href="/orders"
          className={styles.login}
          aria-label="Order"
          title="Order"
        >
          <Receipt size={16} strokeWidth={2.25} aria-hidden />
        </Link>
        <Link
          href={loginHref}
          className={styles.login}
          aria-label="Login"
          title="Login"
        >
          <LogIn size={16} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const initial = (user.name || user.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.avatarBtn} ${open ? styles.avatarOn : ""}`}
        aria-label="Akun"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className={styles.avatarImg}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.initial}>{initial}</span>
        )}
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <p className={styles.roleLabel}>{isAdmin ? "Admin" : "Visitor"}</p>
          <Link
            href="/orders"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Receipt size={14} strokeWidth={2.25} aria-hidden />
            Order
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/products"
              className={styles.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Shield size={14} strokeWidth={2.25} aria-hidden />
              Admin
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button type="submit" className={styles.item} role="menuitem">
              <LogOut size={14} strokeWidth={2.25} aria-hidden />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
