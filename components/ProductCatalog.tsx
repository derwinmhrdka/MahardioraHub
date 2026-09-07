"use client";

import Link from "next/link";
import { MapPin, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import styles from "./ProductCatalog.module.css";

export type CatalogItem = {
  id: number;
  title: string;
  price: number;
  shortNote?: string | null;
  imageUrl?: string | null;
  href: string;
  categoryName?: string | null;
  storeArea?: string | null;
};

type ViewMode = "card" | "list";

type ProductCatalogProps = {
  label: string;
  items: CatalogItem[];
  view?: ViewMode;
};

export function ProductCatalog({
  label,
  items,
  view = "card",
}: ProductCatalogProps) {
  return (
    <>
      <p className={styles.label}>{label}</p>

      {view === "card" ? (
        <div key="card" className="product-grid">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              shortNote={item.shortNote}
              imageUrl={item.imageUrl}
              categoryName={item.categoryName}
              storeArea={item.storeArea}
              href={item.href}
            />
          ))}
        </div>
      ) : (
        <div key="list" className={styles.list}>
          {items.map((item) => (
            <Link key={item.id} href={item.href} className={styles.row}>
              <div className={styles.thumb}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className={styles.thumbImg}
                  />
                ) : (
                  <div className={styles.thumbPlaceholder}>Tanpa gambar</div>
                )}
              </div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>{item.title}</div>
                {item.shortNote ? (
                  <p className={styles.rowNote}>{item.shortNote}</p>
                ) : null}
                {item.categoryName || item.storeArea ? (
                  <div className={styles.rowMeta}>
                    {item.categoryName ? (
                      <span className={styles.metaItem}>
                        <Tag size={10} strokeWidth={2} aria-hidden />
                        {item.categoryName}
                      </span>
                    ) : null}
                    {item.storeArea ? (
                      <span className={styles.metaItem}>
                        <MapPin size={10} strokeWidth={2} aria-hidden />
                        {item.storeArea}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className={styles.rowPrice}>{formatRupiah(item.price)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
