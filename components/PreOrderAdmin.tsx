"use client";

import { useState } from "react";
import { Plane, Plus, Trash2 } from "lucide-react";
import {
  createPreOrderAction,
  deletePreOrderAction,
  updatePreOrderAction,
} from "@/app/admin/(dashboard)/settings/actions";
import { ProductMultiSelect } from "@/components/ProductMultiSelect";
import styles from "./PreOrderAdmin.module.css";

export type PreOrderProductOption = {
  id: number;
  title: string;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  stock: number;
};

export type PreOrderBatchAdmin = {
  id: number;
  lastOrderDate: string;
  productIds: number[];
  status: "upcoming" | "today" | "expired";
};

type PreOrderAdminProps = {
  batches: PreOrderBatchAdmin[];
  products: PreOrderProductOption[];
  todayYmd: string;
};

function BatchEditor({
  batch,
  products,
}: {
  batch: PreOrderBatchAdmin;
  products: PreOrderProductOption[];
}) {
  const [date, setDate] = useState(batch.lastOrderDate);
  const [picked, setPicked] = useState(batch.productIds);

  const statusLabel =
    batch.status === "today"
      ? "Hari ini"
      : batch.status === "expired"
        ? "Lewat"
        : "Aktif";

  return (
    <form action={updatePreOrderAction} className={styles.batch}>
      <input type="hidden" name="id" value={batch.id} />
      <div className={styles.batchHead}>
        <div className={styles.batchTitle}>
          <span className={styles.plane} aria-hidden>
            <Plane size={14} strokeWidth={2.35} />
          </span>
          <span>Pre Order #{batch.id}</span>
        </div>
        <span
          className={`${styles.status} ${
            batch.status === "today"
              ? styles.statusToday
              : batch.status === "expired"
                ? styles.statusExpired
                : styles.statusOk
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor={`lastOrder-${batch.id}`}>Last Order</label>
        <input
          id={`lastOrder-${batch.id}`}
          className={styles.dateInput}
          name="lastOrderDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <ProductMultiSelect
        products={products}
        value={picked}
        onChange={setPicked}
        name="productIds"
      />

      <div className={styles.batchActions}>
        <button type="submit" className="btn">
          Simpan
        </button>
        <button
          type="submit"
          formAction={deletePreOrderAction}
          className={styles.deleteBtn}
          aria-label="Hapus batch"
          title="Hapus"
        >
          <Trash2 size={14} strokeWidth={2.25} aria-hidden />
          Hapus
        </button>
      </div>
    </form>
  );
}

function CreateBatch({
  products,
  todayYmd,
}: {
  products: PreOrderProductOption[];
  todayYmd: string;
}) {
  const [date, setDate] = useState(todayYmd);
  const [picked, setPicked] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className={styles.createToggle}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} strokeWidth={2.35} aria-hidden />
        Buat Pre Order
      </button>
    );
  }

  return (
    <form action={createPreOrderAction} className={styles.batch}>
      <div className={styles.batchHead}>
        <div className={styles.batchTitle}>
          <span className={styles.plane} aria-hidden>
            <Plane size={14} strokeWidth={2.35} />
          </span>
          <span>Pre Order baru</span>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="lastOrder-new">Last Order</label>
        <input
          id="lastOrder-new"
          className={styles.dateInput}
          name="lastOrderDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <ProductMultiSelect
        products={products}
        value={picked}
        onChange={setPicked}
        name="productIds"
      />

      <div className={styles.batchActions}>
        <button type="submit" className="btn">
          Buat
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => {
            setOpen(false);
            setPicked([]);
            setDate(todayYmd);
          }}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

export function PreOrderAdmin({
  batches,
  products,
  todayYmd,
}: PreOrderAdminProps) {
  return (
    <div className={styles.wrap}>
      <CreateBatch products={products} todayYmd={todayYmd} />

      <div className={styles.stack}>
        {batches.length === 0 ? (
          <p className={styles.empty}>Belum ada Pre Order</p>
        ) : (
          batches.map((batch) => (
            <BatchEditor key={batch.id} batch={batch} products={products} />
          ))
        )}
      </div>
    </div>
  );
}
