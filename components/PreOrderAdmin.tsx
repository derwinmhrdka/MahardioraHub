"use client";

import { useMemo, useState } from "react";
import { Plane, Plus, Trash2, X } from "lucide-react";
import {
  createPreOrderAction,
  deletePreOrderAction,
  updatePreOrderAction,
} from "@/app/admin/(dashboard)/settings/actions";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
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

function ProductPicker({
  products,
  picked,
  onChange,
  namePrefix,
}: {
  products: PreOrderProductOption[];
  picked: number[];
  onChange: (ids: number[]) => void;
  namePrefix?: string;
}) {
  const [draftId, setDraftId] = useState("");
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p] as const)),
    [products]
  );
  const available = products.filter((p) => !picked.includes(p.id));

  function addProduct() {
    const id = Number(draftId);
    if (!Number.isFinite(id) || picked.includes(id) || !byId.has(id)) return;
    onChange([...picked, id]);
    setDraftId("");
  }

  return (
    <>
      <div className={styles.pickRow}>
        <select
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          aria-label="Produk"
        >
          <option value="">Pilih produk</option>
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

      <ul className={styles.list}>
        {picked.length === 0 ? (
          <li className={styles.empty}>Belum ada produk</li>
        ) : (
          picked.map((id) => {
            const product = byId.get(id);
            if (!product) return null;
            const src = productImageUrl(product.imageUrl, 80);
            return (
              <li key={id} className={styles.row}>
                {namePrefix ? (
                  <input type="hidden" name={namePrefix} value={id} />
                ) : null}
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
                  onClick={() => onChange(picked.filter((x) => x !== id))}
                >
                  <X size={14} strokeWidth={2.25} aria-hidden />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}

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
      ? "Last order hari ini"
      : batch.status === "expired"
        ? "Sudah lewat"
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

      <div className="form-row">
        <label htmlFor={`lastOrder-${batch.id}`}>Last Order</label>
        <input
          id={`lastOrder-${batch.id}`}
          name="lastOrderDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Produk</label>
        <ProductPicker
          products={products}
          picked={picked}
          onChange={setPicked}
          namePrefix="productIds"
        />
      </div>

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
        Buat Pre Order baru
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

      <div className="form-row">
        <label htmlFor="lastOrder-new">Last Order</label>
        <input
          id="lastOrder-new"
          name="lastOrderDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Produk</label>
        <ProductPicker
          products={products}
          picked={picked}
          onChange={setPicked}
          namePrefix="productIds"
        />
      </div>

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
      <p className={styles.hint}>
        Tanggal = Last Order. Lewat tanggal itu, produk otomatis hilang dari
        Collection. Di hari Last Order, section biru muncul di beranda.
      </p>

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
