"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { productImageUrl } from "@/lib/image-url";
import styles from "./BannerLightbox.module.css";

type BannerLightboxProps = {
  src: string;
  onClose: () => void;
};

export function BannerLightbox({ src, onClose }: BannerLightboxProps) {
  const image = productImageUrl(src, 1600) ?? src;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Banner"
      onClick={onClose}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Tutup"
        title="Tutup"
        onClick={onClose}
      >
        <X size={18} strokeWidth={2.5} aria-hidden />
      </button>
      <div className={styles.frame} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className={styles.image} />
      </div>
    </div>,
    document.body
  );
}
