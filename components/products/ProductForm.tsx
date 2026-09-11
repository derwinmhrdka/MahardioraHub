"use client";

import { useState, useTransition } from "react";
import { ProductKind } from "@prisma/client";
import { fetchProductLinkMetaAction } from "@/app/admin/(dashboard)/products/actions";
import { CategoryField } from "@/components/CategoryField";
import { ImageGalleryField } from "@/components/ImageGalleryField";
import { MoneyInput } from "@/components/MoneyInput";
import { productImages } from "@/lib/product-images";
import {
  clampDiscountPercent,
  discountFromSalePrice,
  formatDiscountPercent,
  salePrice,
} from "@/lib/pricing";
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
  discountPercent?: number;
  stock?: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
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
    defaults.kind ?? ProductKind.secondhand
  );
  const [link, setLink] = useState(defaults.affiliateLink ?? "");
  const [title, setTitle] = useState(defaults.title ?? "");
  const [shortNote, setShortNote] = useState(defaults.shortNote ?? "");
  const [imageUrls, setImageUrls] = useState(
    productImages({
      imageUrl: defaults.imageUrl,
      imageUrls: defaults.imageUrls,
    })
  );
  const [price, setPrice] = useState(
    defaults.price != null ? String(defaults.price) : ""
  );
  const [discountRaw, setDiscountRaw] = useState(() =>
    clampDiscountPercent(defaults.discountPercent ?? 0)
  );
  const [discountPercent, setDiscountPercent] = useState(
    formatDiscountPercent(defaults.discountPercent ?? 0)
  );
  const [totalPrice, setTotalPrice] = useState(() => {
    const normal = defaults.price ?? 0;
    const discount = defaults.discountPercent ?? 0;
    return String(salePrice(normal, discount));
  });
  const [shopName, setShopName] = useState(defaults.shopName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isDeal = kind === ProductKind.deal;

  function onNormalPriceChange(digits: string) {
    setPrice(digits);
    const normal = Number(digits);
    if (!Number.isFinite(normal)) return;
    setTotalPrice(String(salePrice(normal, discountRaw)));
  }

  function onDiscountChange(raw: string) {
    // Allow typing decimals like 47.5 / 42.5563
    const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    const normalized =
      parts.length <= 1
        ? cleaned
        : `${parts[0]}.${parts.slice(1).join("").slice(0, 6)}`;
    setDiscountPercent(normalized);
    const discount = clampDiscountPercent(Number(normalized) || 0);
    setDiscountRaw(discount);
    const normal = Number(price);
    if (!Number.isFinite(normal)) return;
    setTotalPrice(String(salePrice(normal, discount)));
  }

  function onTotalPriceChange(digits: string) {
    setTotalPrice(digits);
    const normal = Number(price);
    const total = Number(digits);
    if (!Number.isFinite(normal) || !Number.isFinite(total) || normal <= 0) {
      return;
    }
    const raw = discountFromSalePrice(normal, total);
    setDiscountRaw(raw);
    setDiscountPercent(formatDiscountPercent(raw));
  }

  function fetchFromLink() {
    if (!link.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const meta = await fetchProductLinkMetaAction(link);
        if (meta.description) setShortNote(meta.description);
        const nextImages = [
          ...(meta.imageUrls ?? []),
          ...(meta.imageUrl ? [meta.imageUrl] : []),
        ].filter(Boolean);
        if (nextImages.length) {
          setImageUrls(Array.from(new Set(nextImages)));
        }
        if (meta.price != null) setPrice(String(meta.price));
        if (meta.platform) setShopName(meta.platform);
        if (!meta.description && nextImages.length === 0) setError("Gagal");
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
          <option value={ProductKind.secondhand}>Collection</option>
          <option value={ProductKind.deal}>My Picks</option>
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

          <CategoryField
            categories={categories}
            defaultCategoryId={defaults.categoryId}
          />

          <div className="form-row">
            <label htmlFor="price">Harga</label>
            <MoneyInput
              id="price"
              name="price"
              value={price}
              onChange={setPrice}
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

          <ImageGalleryField urls={imageUrls} onChange={setImageUrls} />

          <input type="hidden" name="shopName" value={shopName} />
          {(defaults.isActive ?? true) ? (
            <input type="hidden" name="isActive" value="on" />
          ) : null}

          <div className="form-row">
            <label htmlFor="shortNoteDeal">Description</label>
            <textarea
              id="shortNoteDeal"
              name="shortNote"
              rows={4}
              maxLength={2000}
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
            />
          </div>
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
          <CategoryField
            categories={categories}
            defaultCategoryId={defaults.categoryId}
          />
          <div className="form-row">
            <label>Harga</label>
            <div className={styles.priceGrid}>
              <MoneyInput
                id="price"
                name="price"
                value={price}
                onChange={onNormalPriceChange}
                placeholder="Normal"
                aria-label="Harga"
                required
              />
              <input type="hidden" name="discountPercent" value={discountRaw} />
              <input
                id="discountPercent"
                type="text"
                inputMode="decimal"
                value={discountPercent}
                onChange={(e) => onDiscountChange(e.target.value)}
                placeholder="%"
                aria-label="Diskon"
              />
            </div>
            <MoneyInput
              id="totalPrice"
              value={totalPrice}
              onChange={onTotalPriceChange}
              placeholder="Total"
              aria-label="Total"
              className={styles.totalInput}
            />
          </div>
          <div className="form-row">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={defaults.stock ?? 1}
              required
            />
          </div>
          <ImageGalleryField urls={imageUrls} onChange={setImageUrls} />
          <div className="form-row">
            <label htmlFor="shortNote">Description</label>
            <textarea
              id="shortNote"
              name="shortNote"
              rows={4}
              maxLength={2000}
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
