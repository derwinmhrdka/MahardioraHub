"use client";

import { useState, useTransition } from "react";
import { ProductKind } from "@prisma/client";
import { fetchProductLinkMetaAction } from "@/app/admin/(dashboard)/products/actions";
import styles from "./ProductForm.module.css";

type Category = {
  id: number;
  name: string;
};

type ProductFormValues = {
  kind?: ProductKind;
  title?: string;
  categoryId?: number;
  price?: number;
  imageUrl?: string | null;
  shortNote?: string | null;
  storeArea?: string | null;
  shopName?: string | null;
  affiliateLink?: string | null;
  isActive?: boolean;
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  productId?: number;
  defaults?: ProductFormValues;
  submitLabel?: string;
};

export function ProductForm({
  action,
  categories,
  productId,
  defaults = {},
  submitLabel = "Simpan",
}: ProductFormProps) {
  const [kind, setKind] = useState<ProductKind>(
    defaults.kind ?? ProductKind.deal
  );
  const [link, setLink] = useState(defaults.affiliateLink ?? "");
  const [title, setTitle] = useState(defaults.title ?? "");
  const [shortNote, setShortNote] = useState(defaults.shortNote ?? "");
  const [imageUrl, setImageUrl] = useState(defaults.imageUrl ?? "");
  const [price, setPrice] = useState(
    defaults.price != null ? String(defaults.price) : ""
  );
  const [shopName, setShopName] = useState(defaults.shopName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isDeal = kind === ProductKind.deal;

  function fetchFromLink() {
    if (!link.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const meta = await fetchProductLinkMetaAction(link);
        if (meta.description) setShortNote(meta.description);
        if (meta.imageUrl) setImageUrl(meta.imageUrl);
        if (meta.price != null) setPrice(String(meta.price));
        if (meta.platform) setShopName(meta.platform);
        if (!meta.description && !meta.imageUrl) setError("Gagal");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal");
      }
    });
  }

  return (
    <form action={action} className="form admin-form">
      {productId != null ? (
        <input type="hidden" name="id" value={productId} />
      ) : null}

      <div className="form-row">
        <label htmlFor="kind">Jenis</label>
        <select
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as ProductKind)}
          required
        >
          <option value={ProductKind.deal}>Deal</option>
          <option value={ProductKind.secondhand}>Secondhand</option>
        </select>
      </div>

      {isDeal ? (
        <>
          <div className="form-row">
            <label htmlFor="affiliateLink">Link</label>
            <div className={styles.linkRow}>
              <input
                id="affiliateLink"
                name="affiliateLink"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => {
                  if (link.trim()) fetchFromLink();
                }}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fetchFromLink}
                disabled={pending || !link.trim()}
              >
                {pending ? "..." : "Ambil"}
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>

          <div className="form-row">
            <label htmlFor="title">Judul</label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="categoryId">Kategori</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={defaults.categoryId ?? categories[0]?.id}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="price">Harga</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="storeArea">Area</label>
            <input
              id="storeArea"
              name="storeArea"
              defaultValue={defaults.storeArea ?? ""}
            />
          </div>

          <input type="hidden" name="shortNote" value={shortNote} />
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="shopName" value={shopName} />
          {(defaults.isActive ?? true) ? (
            <input type="hidden" name="isActive" value="on" />
          ) : null}

          {(imageUrl || shortNote) && (
            <div className={styles.preview}>
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" />
              ) : null}
              {shortNote ? <p>{shortNote}</p> : null}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="form-row">
            <label htmlFor="title">Judul</label>
            <input
              id="title"
              name="title"
              defaultValue={defaults.title ?? ""}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="categoryId">Kategori</label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={defaults.categoryId ?? categories[0]?.id}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="price">Harga</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={defaults.price ?? ""}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="imageUrl">Gambar</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              defaultValue={defaults.imageUrl ?? ""}
            />
          </div>
          <div className="form-row">
            <label htmlFor="shortNote">Catatan</label>
            <input
              id="shortNote"
              name="shortNote"
              maxLength={120}
              defaultValue={defaults.shortNote ?? ""}
            />
          </div>
          <div className="form-row">
            <label htmlFor="storeArea">Area</label>
            <input
              id="storeArea"
              name="storeArea"
              defaultValue={defaults.storeArea ?? ""}
            />
          </div>
          <input type="hidden" name="shopName" value="" />
          <input type="hidden" name="affiliateLink" value="" />
          <div className="form-row">
            <label className="admin-check">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={defaults.isActive ?? true}
              />
              Tampil
            </label>
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-block">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
