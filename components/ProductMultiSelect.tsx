"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import styles from "./ProductMultiSelect.module.css";

export type ProductMultiSelectOption = {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
};

type ProductMultiSelectProps = {
  products: ProductMultiSelectOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  /** Hidden input name for form submit (repeated per id). */
  name?: string;
  label?: string;
  placeholder?: string;
};

export function ProductMultiSelect({
  products,
  value,
  onChange,
  name = "productIds",
  label = "Produk",
  placeholder = "Cari & pilih produk",
}: ProductMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p] as const)),
    [products]
  );

  const selected = useMemo(
    () => value.map((id) => byId.get(id)).filter(Boolean) as ProductMultiSelectOption[],
    [value, byId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function remove(id: number) {
    onChange(value.filter((x) => x !== id));
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>
          {value.length > 0 ? `${value.length} dipilih` : "0 dipilih"}
        </span>
      </div>

      {value.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerText}>
          {value.length > 0
            ? `${value.length} produk dipilih`
            : placeholder}
        </span>
        <ChevronDown size={16} strokeWidth={2.35} aria-hidden />
      </button>

      {open ? (
        <div className={styles.dropdown} role="listbox" id={listId} aria-multiselectable>
          <div className={styles.search}>
            <Search size={14} strokeWidth={2.35} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              aria-label="Cari produk"
              autoFocus
            />
          </div>

          <ul className={styles.options}>
            {filtered.length === 0 ? (
              <li className={styles.empty}>Tidak ada</li>
            ) : (
              filtered.map((product) => {
                const on = value.includes(product.id);
                const src = productImageUrl(product.imageUrl, 72);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={`${styles.option} ${on ? styles.optionOn : ""}`}
                      onClick={() => toggle(product.id)}
                    >
                      <span
                        className={`${styles.check} ${on ? styles.checkOn : ""}`}
                        aria-hidden
                      >
                        {on ? <Check size={11} strokeWidth={3} /> : null}
                      </span>
                      <span className={styles.thumb} aria-hidden>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" />
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className={styles.meta}>
                        <span className={styles.title}>{product.title}</span>
                        <span className={styles.price}>
                          {formatRupiah(product.price)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <ul className={styles.chips}>
          {selected.map((product) => {
            const src = productImageUrl(product.imageUrl, 64);
            return (
              <li key={product.id} className={styles.chip}>
                <span className={styles.chipThumb} aria-hidden>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" />
                  ) : (
                    "—"
                  )}
                </span>
                <span className={styles.chipTitle}>{product.title}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Hapus ${product.title}`}
                  onClick={() => remove(product.id)}
                >
                  <X size={12} strokeWidth={2.5} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
