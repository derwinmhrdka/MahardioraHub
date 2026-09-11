"use client";

import Link from "next/link";
import clsx from "clsx";
import { MapPin, Tag } from "lucide-react";
import { productImageUrl } from "@/lib/image-url";
import { ProductCard } from "@/components/ProductCard";
import { productNotePreview } from "@/components/ProductNote";
import { ProductPrice } from "@/components/ProductPrice";
import styles from "./ProductCatalog.module.css";

export type CatalogItem = {
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
              discountPercent={item.discountPercent}
              stock={item.stock}
              shortNote={item.shortNote}
              imageUrl={item.imageUrl}
              categoryName={item.categoryName}
              storeArea={item.storeArea}
              href={item.href}
              isPreOrder={item.isPreOrder}
            />
          ))}
        </div>
      ) : (
        <div key="list" className={styles.list}>
          {items.map((item) => {
            const thumb = productImageUrl(item.imageUrl, 120);
            const notePreview = productNotePreview(item.shortNote);
            const soldOut = item.stock != null && item.stock <= 0;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={clsx(styles.row, soldOut && styles.rowSoldOut)}
                aria-label={soldOut ? `${item.title} — Sold Out` : item.title}
              >
                <div className={styles.thumb}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className={styles.thumbImg}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder}>Tanpa gambar</div>
                  )}
                  {soldOut ? (
                    <span className={styles.rowSoldBadge}>Sold Out!</span>
                  ) : item.isPreOrder ? (
                    <span className={styles.rowPreOrderBadge}>Pre Order</span>
                  ) : null}
                </div>
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>{item.title}</div>
                  {notePreview ? (
                    <p className={styles.rowNote}>{notePreview}</p>
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
                <div className={styles.rowPrice}>
                  <ProductPrice
                    price={item.price}
                    discountPercent={item.discountPercent}
                    size="list"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
