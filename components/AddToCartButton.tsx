"use client";

import { useFormStatus } from "react-dom";
import { ShoppingCart } from "lucide-react";
import { addToCartAction } from "@/app/cart/actions";
import styles from "./AddToCartButton.module.css";

type AddToCartButtonProps = {
  productId: number;
  next?: string;
  stock?: number;
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
      <SubmitButton />
    </form>
  );
}
