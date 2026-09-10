"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { ImageGalleryField } from "@/components/ImageGalleryField";
import {
  COLLECTION_BANNER_RATIO,
  COLLECTION_BANNER_SIZE_HINT,
} from "@/lib/collection-banner";
import styles from "./CollectionBannerAdmin.module.css";

type CollectionBannerAdminProps = {
  isActive: boolean;
  images: string[];
  action: (formData: FormData) => void | Promise<void>;
};

export function CollectionBannerAdmin({
  isActive,
  images,
  action,
}: CollectionBannerAdminProps) {
  const [active, setActive] = useState(isActive);
  const [urls, setUrls] = useState(images);
  const [pending, startTransition] = useTransition();

  function clearAll() {
    if (urls.length === 0) return;
    setUrls([]);
    setActive(false);
    const formData = new FormData();
    formData.set("isActive", "off");
    formData.set("images", "");
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <form action={action} className={`form admin-form ${styles.form}`}>
      <div className={styles.topRow}>
        <label className={`admin-check ${styles.check}`}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={urls.length === 0}
          />
          Aktif
        </label>
        <input type="hidden" name="isActive" value={active ? "on" : "off"} />
        {urls.length > 0 ? (
          <button
            type="button"
            className={styles.clearBtn}
            aria-label="Hapus"
            title="Hapus"
            disabled={pending}
            onClick={clearAll}
          >
            <Trash2 size={14} strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>

      <div
        className={styles.ratioBlock}
        aria-label={`Ratio ${COLLECTION_BANNER_RATIO}`}
      >
        <div className={styles.ratioFrame}>
          <span className={styles.ratioLabel}>{COLLECTION_BANNER_RATIO}</span>
          <span className={styles.ratioSize}>{COLLECTION_BANNER_SIZE_HINT}</span>
        </div>
      </div>

      <div className="form-row">
        <label>Gambar</label>
        <ImageGalleryField
          urls={urls}
          onChange={(next) => {
            setUrls(next);
            if (next.length === 0) setActive(false);
          }}
        />
        <input type="hidden" name="images" value={urls.join("\n")} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-block" disabled={pending}>
          Simpan
        </button>
      </div>
    </form>
  );
}
