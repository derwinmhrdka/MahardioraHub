"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import {
  removeCartItemAction,
  toggleAllCartSelectedAction,
  toggleCartItemSelectedAction,
  updateCartQtyAction,
} from "@/app/cart/actions";
import styles from "./CartView.module.css";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { salePrice } from "@/lib/pricing";

export type CartViewItem = {
  productId: number;
  title: string;
  quantity: number;
  stock: number;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  selected: boolean;
};

type CartViewProps = {
  items: CartViewItem[];
};

export function CartView({ items }: CartViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className={styles.empty}>Kosong</p>;
  }

  const selectedItems = items.filter((item) => item.selected);
  const allSelected = selectedItems.length === items.length;
  const total = selectedItems.reduce(
    (sum, item) =>
      sum + salePrice(item.price, item.discountPercent) * item.quantity,
    0
  );
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function run(action: (fd: FormData) => Promise<void>, fd: FormData) {
    startTransition(async () => {
      await action(fd);
      router.refresh();
    });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.selectAll}
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("selected", allSelected ? "0" : "1");
            run(toggleAllCartSelectedAction, fd);
          }}
        >
          <span
            className={`${styles.check} ${allSelected ? styles.checkOn : ""}`}
            aria-hidden
          >
            {allSelected ? <Check size={12} strokeWidth={3} /> : null}
          </span>
          <span>{allSelected ? "Batal semua" : "Pilih semua"}</span>
        </button>
        <span className={styles.toolbarMeta}>
          {selectedCount > 0 ? `${selectedCount} dipilih` : "Belum dipilih"}
        </span>
      </div>

      <ul className={styles.list}>
        {items.map((item) => {
          const unit = salePrice(item.price, item.discountPercent);
          const href = `/secondhand/${item.productId}`;
          const src = productImageUrl(item.imageUrl, 120);
          const atMax = item.quantity >= item.stock;

          return (
            <li
              key={item.productId}
              className={`${styles.row} ${item.selected ? "" : styles.rowOff}`}
            >
              <button
                type="button"
                className={styles.checkBtn}
                disabled={pending}
                aria-pressed={item.selected}
                aria-label={item.selected ? "Batalkan pilih" : "Pilih item"}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("productId", String(item.productId));
                  fd.set("selected", item.selected ? "0" : "1");
                  run(toggleCartItemSelectedAction, fd);
                }}
              >
                <span
                  className={`${styles.check} ${
                    item.selected ? styles.checkOn : ""
                  }`}
                >
                  {item.selected ? (
                    <Check size={12} strokeWidth={3} aria-hidden />
                  ) : null}
                </span>
              </button>

              <Link href={href} className={styles.thumb}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" />
                ) : (
                  <span className={styles.thumbEmpty}>—</span>
                )}
              </Link>

              <div className={styles.body}>
                <Link href={href} className={styles.title}>
                  {item.title}
                </Link>
                <p className={styles.price}>{formatRupiah(unit)}</p>

                <div className={styles.qtyRow}>
                  <form action={updateCartQtyAction}>
                    <input
                      type="hidden"
                      name="productId"
                      value={item.productId}
                    />
                    <input
                      type="hidden"
                      name="quantity"
                      value={item.quantity - 1}
                    />
                    <button
                      type="submit"
                      className={styles.qtyBtn}
                      aria-label="Kurang"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={12} strokeWidth={2.5} aria-hidden />
                    </button>
                  </form>
                  <span className={styles.qty}>{item.quantity}</span>
                  <form action={updateCartQtyAction}>
                    <input
                      type="hidden"
                      name="productId"
                      value={item.productId}
                    />
                    <input
                      type="hidden"
                      name="quantity"
                      value={item.quantity + 1}
                    />
                    <button
                      type="submit"
                      className={styles.qtyBtn}
                      aria-label="Tambah"
                      disabled={atMax}
                    >
                      <Plus size={12} strokeWidth={2.5} aria-hidden />
                    </button>
                  </form>
                </div>
              </div>

              <form action={removeCartItemAction} className={styles.removeForm}>
                <input type="hidden" name="productId" value={item.productId} />
                <button
                  type="submit"
                  className={styles.remove}
                  aria-label="Hapus"
                  title="Hapus"
                >
                  <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <div className={styles.footerMeta}>
          <p className={styles.total}>{formatRupiah(total)}</p>
        </div>
        {selectedCount > 0 ? (
          <Link href="/checkout" className={styles.checkout}>
            Checkout
          </Link>
        ) : (
          <span className={`${styles.checkout} ${styles.checkoutDisabled}`}>
            Checkout
          </span>
        )}
      </div>
    </div>
  );
}
