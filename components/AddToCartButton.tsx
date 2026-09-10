"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/cart/actions";
import styles from "./AddToCartButton.module.css";

type AddToCartButtonProps = {
  productId: number;
  next?: string;
  stock?: number;
  loggedIn?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.btn} disabled={pending}>
      <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
      {pending ? "..." : "Tambah"}
    </button>
  );
}

export function AddToCartButton({
  productId,
  next,
  stock = 0,
  loggedIn = true,
}: AddToCartButtonProps) {
  const returnTo = next || `/secondhand/${productId}`;
  const available = stock > 0;
  const maxQty = Math.max(1, stock);
  const [qty, setQty] = useState(1);

  function dec() {
    setQty((v) => Math.max(1, v - 1));
  }

  function inc() {
    setQty((v) => Math.min(maxQty, v + 1));
  }

  if (!available) {
    return (
      <div className={styles.row}>
        <div className={styles.qty} aria-hidden>
          <button type="button" className={styles.qtyBtn} disabled>
            <Minus size={12} strokeWidth={2.5} />
          </button>
          <span className={styles.qtyVal}>0</span>
          <button type="button" className={styles.qtyBtn} disabled>
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>
        <button type="button" className={styles.btn} disabled>
          <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
          Tambah
        </button>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className={styles.row}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Kurang"
            onClick={dec}
            disabled={qty <= 1}
          >
            <Minus size={12} strokeWidth={2.5} aria-hidden />
          </button>
          <span className={styles.qtyVal}>{qty}</span>
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Tambah"
            onClick={inc}
            disabled={qty >= maxQty}
          >
            <Plus size={12} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(returnTo)}`}
          className={styles.btn}
        >
          <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
          Tambah
        </Link>
      </div>
    );
  }

  return (
    <form action={addToCartAction} className={styles.form}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="next" value={returnTo} />
      <input type="hidden" name="quantity" value={qty} />
      <div className={styles.row}>
        <div className={styles.qty}>
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Kurang"
            onClick={dec}
            disabled={qty <= 1}
          >
            <Minus size={12} strokeWidth={2.5} aria-hidden />
          </button>
          <span className={styles.qtyVal} aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Tambah qty"
            onClick={inc}
            disabled={qty >= maxQty}
          >
            <Plus size={12} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
