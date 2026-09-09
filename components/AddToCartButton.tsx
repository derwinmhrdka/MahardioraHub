"use client";

import { ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/cart/actions";
import styles from "./AddToCartButton.module.css";

type AddToCartButtonProps = {
  productId: number;
  next?: string;
  stock?: number;
};

export function AddToCartButton({
  productId,
  next,
  stock = 0,
}: AddToCartButtonProps) {
  const returnTo = next || `/secondhand/${productId}`;
  const available = stock > 0;

  if (!available) {
    return (
      <button type="button" className={styles.btn} disabled>
        <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
        Tambah
      </button>
    );
  }

  return (
    <form action={addToCartAction} className={styles.form}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="next" value={returnTo} />
      <button type="submit" className={styles.btn}>
        <ShoppingCart size={16} strokeWidth={2.25} aria-hidden />
        Tambah
      </button>
    </form>
  );
}
