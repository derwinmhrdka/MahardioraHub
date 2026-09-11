"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { updateFlashSaleAction } from "@/app/admin/(dashboard)/settings/actions";
import { ProductMultiSelect } from "@/components/ProductMultiSelect";
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

      <ProductMultiSelect
        products={products}
        value={picked}
        onChange={setPicked}
        name="productIds"
      />

      <div className="form-actions">
        <button type="submit" className="btn btn-block">
          Simpan
        </button>
      </div>
    </form>
  );
}
