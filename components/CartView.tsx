import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  removeCartItemAction,
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
};

type CartViewProps = {
  items: CartViewItem[];
  checkoutHref: string | null;
};

export function CartView({ items, checkoutHref }: CartViewProps) {
  if (items.length === 0) {
    return <p className={styles.empty}>Kosong</p>;
  }

  const total = items.reduce(
    (sum, item) =>
      sum + salePrice(item.price, item.discountPercent) * item.quantity,
    0
  );

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {items.map((item) => {
          const unit = salePrice(item.price, item.discountPercent);
          const href = `/secondhand/${item.productId}`;
          const src = productImageUrl(item.imageUrl, 120);
          const atMax = item.quantity >= item.stock;

          return (
            <li key={item.productId} className={styles.row}>
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
                    <input type="hidden" name="productId" value={item.productId} />
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
                    <input type="hidden" name="productId" value={item.productId} />
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
        <p className={styles.total}>{formatRupiah(total)}</p>
        {checkoutHref ? (
          <a
            href={checkoutHref}
            className={styles.checkout}
            target="_blank"
            rel="noopener noreferrer"
          >
            Checkout
          </a>
        ) : null}
      </div>
    </div>
  );
}
