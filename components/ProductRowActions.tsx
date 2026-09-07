"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import styles from "./AdminProductList.module.css";

type ProductRowActionsProps = {
  productId: number;
  title: string;
  isActive: boolean;
  hideAction: (formData: FormData) => void | Promise<void>;
  showAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function ProductRowActions({
  productId,
  title,
  isActive,
  hideAction,
  showAction,
  deleteAction,
}: ProductRowActionsProps) {
  return (
    <>
      <form action={isActive ? hideAction : showAction}>
        <input type="hidden" name="id" value={productId} />
        <button
          type="submit"
          className={styles.iconBtn}
          title={isActive ? "Hide dari Site" : "Tampilkan di Site"}
          aria-label={
            isActive ? `Hide ${title}` : `Tampilkan ${title}`
          }
        >
          {isActive ? (
            <EyeOff size={15} strokeWidth={2} />
          ) : (
            <Eye size={15} strokeWidth={2} />
          )}
        </button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(event) => {
          const ok = window.confirm(
            `Hapus "${title}" permanen? Tidak bisa dibatalkan.`
          );
          if (!ok) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={productId} />
        <button
          type="submit"
          className={`${styles.iconBtn} ${styles.iconDanger}`}
          title="Hapus permanen"
          aria-label={`Hapus ${title}`}
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </form>
    </>
  );
}
