"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, MapPin, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import styles from "./ProductCatalog.module.css";

const STORAGE_KEY = "dealhub-catalog-view";

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
};

export function ProductCatalog({ label, items }: ProductCatalogProps) {
  const [view, setView] = useState<ViewMode>("card");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "card" || saved === "list") {
      setView(saved);
    }
  }, []);

  function choose(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.label}>{label}</p>
        <div className={styles.toggle} role="group" aria-label="Layout">
          <button
            type="button"
            aria-pressed={view === "card"}
            aria-label="Card layout"
            title="Cards"
            onClick={() => choose("card")}
          >
            <LayoutGrid size={15} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            aria-label="List layout"
            title="List"
            onClick={() => choose("list")}
          >
            <List size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

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
                  <div className={styles.thumbPlaceholder}>No img</div>
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
                        <Tag size={12} strokeWidth={2} aria-hidden />
                        {item.categoryName}
                      </span>
                    ) : null}
                    {item.storeArea ? (
                      <span className={styles.metaItem}>
                        <MapPin size={12} strokeWidth={2} aria-hidden />
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
