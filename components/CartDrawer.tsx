"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { CartView, type CartViewItem } from "@/components/CartView";
import styles from "./CartDrawer.module.css";

type CartDrawerProps = {
  count: number;
  loggedIn: boolean;
  items: CartViewItem[];
  checkoutHref: string | null;
  xenditEnabled?: boolean;
};

export function CartDrawer({
  count,
  loggedIn,
  items,
  checkoutHref,
  xenditEnabled = false,
}: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!loggedIn) {
    return (
      <Link
        href="/login?next=/secondhand"
        className={styles.trigger}
        aria-label="Cart"
        title="Cart"
      >
        <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
      </Link>
    );
  }

  const overlay =
    open && mounted
      ? createPortal(
          <div className={styles.root}>
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Tutup"
              onClick={() => setOpen(false)}
            />
            <aside
              ref={panelRef}
              className={styles.panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
            >
              <div className={styles.head}>
                <h2 id={titleId} className={styles.title}>
                  Cart
                </h2>
                <button
                  type="button"
                  className={styles.close}
                  aria-label="Tutup"
                  title="Tutup"
                  onClick={() => setOpen(false)}
                >
                  <X size={16} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              <div className={styles.body}>
                <CartView
                  items={items}
                  checkoutHref={checkoutHref}
                  xenditEnabled={xenditEnabled}
                />
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Cart"
        title="Cart"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        onClick={() => setOpen(true)}
      >
        <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
        {count > 0 ? (
          <span className={styles.badge}>{count > 99 ? "99+" : count}</span>
        ) : null}
      </button>
      {overlay}
    </>
  );
}
