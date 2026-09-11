import Link from "next/link";
import { Plane } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import {
  formatDiscountPercent,
  hasDiscount,
  salePrice,
} from "@/lib/pricing";
import styles from "./PreOrderStrip.module.css";

export type PreOrderStripItem = {
  productId: number;
  title: string;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  href: string;
};

type PreOrderStripProps = {
  lastOrderDate: string;
  items: PreOrderStripItem[];
};

function shortTitle(title: string, maxChars = 16) {
  const text = title.trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}..`;
}

export function PreOrderStrip({ lastOrderDate, items }: PreOrderStripProps) {
  if (items.length === 0) return null;

  const dateLabel = new Date(`${lastOrderDate}T00:00:00.000Z`).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "short" }
  );

  return (
    <section className={styles.wrap} aria-label="Pre Order">
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.planeIcon} aria-hidden>
            <Plane size={14} strokeWidth={2.5} />
          </span>
          Pre Order
        </h2>
        <span className={styles.badge} aria-live="polite">
          Last Order · {dateLabel}
        </span>
      </div>

      <p className={styles.note}>Hari terakhir pesan — jangan sampai kelewatan</p>

      <ul className={styles.scroller}>
        {items.map((item) => {
          const src = productImageUrl(item.imageUrl, 160);
          const discounted = hasDiscount(item.discountPercent);
          const total = salePrice(item.price, item.discountPercent);
          return (
            <li key={item.productId} className={styles.card}>
              <Link href={item.href} className={styles.link}>
                <span className={styles.thumb}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.thumbEmpty}>—</span>
                  )}
                  {discounted ? (
                    <span className={styles.discBadge} aria-hidden>
                      -{formatDiscountPercent(item.discountPercent)}%
                    </span>
                  ) : (
                    <span className={styles.poBadge} aria-hidden>
                      PO
                    </span>
                  )}
                  <span className={styles.caption}>
                    <span className={styles.cardTitle} title={item.title}>
                      {shortTitle(item.title)}
                    </span>
                    {discounted ? (
                      <span className={styles.wasPrice}>
                        {formatRupiah(item.price)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className={styles.body}>
                  <span className={styles.nowPrice}>{formatRupiah(total)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
