import Link from "next/link";
import clsx from "clsx";
import { MapPin, Tag } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { productImageUrl } from "@/lib/image-url";
import { ProductPrice } from "@/components/ProductPrice";
import { productNotePreview } from "@/components/ProductNote";
import { formatDiscountPercent, hasDiscount } from "@/lib/pricing";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  id: number;
  title: string;
  price: number;
  discountPercent?: number | null;
  stock?: number | null;
  shortNote?: string | null;
  imageUrl?: string | null;
  href: string;
  categoryName?: string | null;
  storeArea?: string | null;
  isPreOrder?: boolean;
};

export function ProductCard({
  title,
  price,
  discountPercent = 0,
  stock,
  shortNote,
  imageUrl,
  href,
  categoryName,
  storeArea,
  isPreOrder = false,
}: ProductCardProps) {
  const hasMeta = Boolean(categoryName || storeArea);
  const src = productImageUrl(imageUrl, 400);
  const notePreview = productNotePreview(shortNote);
  const soldOut = stock != null && stock <= 0;

  return (
    <Link
      href={href}
      className={clsx(styles.card, soldOut && styles.soldOut)}
      aria-label={soldOut ? `${title} — Sold Out` : title}
    >
      <div className={styles.imageWrap}>
        {src ? (
          <SmartImage
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 220px"
            className={styles.image}
            fallback={<div className={styles.placeholder}>Tidak ada gambar</div>}
          />
        ) : (
          <div className={styles.placeholder}>Tidak ada gambar</div>
        )}
        {soldOut ? (
          <span className={styles.soldBadge}>Sold Out!</span>
        ) : hasDiscount(discountPercent) ? (
          <span className={styles.discBadge} aria-hidden>
            -{formatDiscountPercent(discountPercent ?? 0)}%
          </span>
        ) : null}
        {!soldOut && isPreOrder ? (
          <span className={styles.preOrderBadge}>Pre Order</span>
        ) : null}
      </div>
      <div className={styles.body}>
        <ProductPrice
          price={price}
          discountPercent={discountPercent}
          size="card"
        />
        <div className={styles.title}>{title}</div>
        {notePreview ? <p className={styles.note}>{notePreview}</p> : null}
        {hasMeta ? (
          <div className={styles.meta}>
            {categoryName ? (
              <span className={styles.metaItem}>
                <Tag size={10} strokeWidth={2} aria-hidden />
                <span>{categoryName}</span>
              </span>
            ) : null}
            {storeArea ? (
              <span className={styles.metaItem}>
                <MapPin size={10} strokeWidth={2} aria-hidden />
                <span>{storeArea}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
