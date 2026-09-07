import Link from "next/link";
import { MapPin, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  id: number;
  title: string;
  price: number;
  shortNote?: string | null;
  imageUrl?: string | null;
  href: string;
  categoryName?: string | null;
  storeArea?: string | null;
};

export function ProductCard({
  title,
  price,
  shortNote,
  imageUrl,
  href,
  categoryName,
  storeArea,
}: ProductCardProps) {
  const hasMeta = Boolean(categoryName || storeArea);

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.imageWrap}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className={styles.image} />
        ) : (
          <div className={styles.placeholder}>Tidak ada gambar</div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.price}>{formatRupiah(price)}</div>
        <div className={styles.title}>{title}</div>
        {shortNote ? <p className={styles.note}>{shortNote}</p> : null}
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
