"use client";

import { useMemo, useState } from "react";
import { Flame, Plus, X } from "lucide-react";
import { updateFlashSaleAction } from "@/app/admin/(dashboard)/settings/actions";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import styles from "./FlashSaleAdmin.module.css";

export type FlashSaleProductOption = {
  id: number;
  title: string;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  stock: number;
};

type FlashSaleAdminProps = {
  isActive: boolean;
  durationMinutes: number;
  endsAt: string | null;
  selectedIds: number[];
  products: FlashSaleProductOption[];
};

export function FlashSaleAdmin({
  isActive,
  durationMinutes,
  endsAt,
  selectedIds,
  products,
}: FlashSaleAdminProps) {
  const [active, setActive] = useState(isActive);
  const [duration, setDuration] = useState(String(durationMinutes));
  const [picked, setPicked] = useState<number[]>(selectedIds);
  const [draftId, setDraftId] = useState("");

  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p] as const)),
    [products]
  );

  const available = products.filter((p) => !picked.includes(p.id));

  function addProduct() {
    const id = Number(draftId);
    if (!Number.isFinite(id) || picked.includes(id)) return;
    if (!byId.has(id)) return;
    setPicked((prev) => [...prev, id]);
    setDraftId("");
  }

  function removeProduct(id: number) {
    setPicked((prev) => prev.filter((x) => x !== id));
  }

  return (
    <form action={updateFlashSaleAction} className="form admin-form">
      <div className="form-row">
        <label className="admin-check">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Aktif
        </label>
        <input type="hidden" name="isActive" value={active ? "on" : "off"} />
      </div>

      <div className="form-row">
        <label htmlFor="durationMinutes">Durasi</label>
        <div className={styles.durationRow}>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <span className={styles.unit}>menit</span>
        </div>
      </div>

      {endsAt && active ? (
        <p className={styles.endsHint}>
          <Flame size={12} strokeWidth={2.25} aria-hidden />
          {new Date(endsAt).toLocaleString("id-ID")}
        </p>
      ) : null}

      <div className="form-row">
        <label>Produk</label>
        <div className={styles.pickRow}>
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            aria-label="Produk"
          >
            <option value="">Pilih</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Tambah"
            title="Tambah"
            onClick={addProduct}
            disabled={!draftId}
          >
            <Plus size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      <ul className={styles.list}>
        {picked.length === 0 ? (
          <li className={styles.empty}>—</li>
        ) : (
          picked.map((id) => {
            const product = byId.get(id);
            if (!product) return null;
            const src = productImageUrl(product.imageUrl, 80);
            return (
              <li key={id} className={styles.row}>
                <input type="hidden" name="productIds" value={id} />
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
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="Hapus"
                  title="Hapus"
                  onClick={() => removeProduct(id)}
                >
                  <X size={14} strokeWidth={2.25} aria-hidden />
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="form-actions">
        <button type="submit" className="btn btn-block">
          Simpan
        </button>
      </div>
    </form>
  );
}
