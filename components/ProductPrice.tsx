import { formatRupiah } from "@/lib/format";
import {
  clampDiscountPercent,
  formatDiscountPercent,
  hasDiscount,
  salePrice,
} from "@/lib/pricing";
import styles from "./ProductPrice.module.css";

type ProductPriceProps = {
  price: number;
  discountPercent?: number | null;
  size?: "card" | "list" | "detail" | "admin";
};

export function ProductPrice({
  price,
  discountPercent = 0,
  size = "card",
}: ProductPriceProps) {
  const discount = clampDiscountPercent(discountPercent ?? 0);
  const discounted = hasDiscount(discount);
  const total = salePrice(price, discount);
  const discountLabel = formatDiscountPercent(discount);

  if (!discounted) {
    return (
      <p className={`${styles.price} ${styles[size]}`}>
        {formatRupiah(price)}
      </p>
    );
  }

  return (
    <div className={`${styles.wrap} ${styles[size]}`}>
      <p className={styles.row}>
        <span className={styles.now}>{formatRupiah(total)}</span>
        <span className={styles.was}>{formatRupiah(price)}</span>
      </p>
      {size === "detail" ? (
        <span
          className={`${styles.badge} ${styles.burst}`}
          aria-label={`Diskon ${discountLabel}%`}
        >
          -{discountLabel}%
        </span>
      ) : null}
    </div>
  );
}
