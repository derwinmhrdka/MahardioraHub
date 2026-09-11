"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  COLLECTION_BANNER_ASPECT,
  COLLECTION_BANNER_OUT_HEIGHT,
  COLLECTION_BANNER_OUT_WIDTH,
} from "@/lib/collection-banner";
import styles from "./BannerCropDialog.module.css";

type BannerCropDialogProps = {
  src: string;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

function coverScale(nw: number, nh: number, vw: number, vh: number) {
  return Math.max(vw / nw, vh / nh);
}

function clampPan(
  ox: number,
  oy: number,
  nw: number,
  nh: number,
  vw: number,
  vh: number,
  scale: number
) {
  const iw = nw * scale;
  const ih = nh * scale;
  const maxX = Math.max(0, (iw - vw) / 2);
  const maxY = Math.max(0, (ih - vh) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, ox)),
    y: Math.min(maxY, Math.max(-maxY, oy)),
  };
}

export function BannerCropDialog({
  src,
  onCancel,
  onConfirm,
}: BannerCropDialogProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 320, h: 320 / COLLECTION_BANNER_ASPECT });

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    function measure() {
      if (!node) return;
      const w = node.clientWidth;
      setViewport({ w, h: w / COLLECTION_BANNER_ASPECT });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setReady(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    if (!ready || !natural.w) return;
    const base = coverScale(natural.w, natural.h, viewport.w, viewport.h);
    const scale = base * zoom;
    setOffset((prev) =>
      clampPan(prev.x, prev.y, natural.w, natural.h, viewport.w, viewport.h, scale)
    );
  }, [zoom, viewport.w, viewport.h, natural.w, natural.h, ready]);

  function onImageLoad() {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setReady(true);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!ready || busy) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const base = coverScale(natural.w, natural.h, viewport.w, viewport.h);
    const scale = base * zoom;
    const next = clampPan(
      drag.originX + (e.clientX - drag.startX),
      drag.originY + (e.clientY - drag.startY),
      natural.w,
      natural.h,
      viewport.w,
      viewport.h,
      scale
    );
    setOffset(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !ready || busy) return;
    setBusy(true);
    try {
      const base = coverScale(natural.w, natural.h, viewport.w, viewport.h);
      const scale = base * zoom;
      const left = viewport.w / 2 - (natural.w * scale) / 2 + offset.x;
      const top = viewport.h / 2 - (natural.h * scale) / 2 + offset.y;
      const srcX = (0 - left) / scale;
      const srcY = (0 - top) / scale;
      const srcW = viewport.w / scale;
      const srcH = viewport.h / scale;

      const canvas = document.createElement("canvas");
      canvas.width = COLLECTION_BANNER_OUT_WIDTH;
      canvas.height = COLLECTION_BANNER_OUT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Gagal");
      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        COLLECTION_BANNER_OUT_WIDTH,
        COLLECTION_BANNER_OUT_HEIGHT
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Gagal"))),
          "image/webp",
          0.86
        );
      });

      const file = new File([blob], `banner-${Date.now()}.webp`, {
        type: "image/webp",
      });
      await onConfirm(file);
    } catch {
      setBusy(false);
    }
  }

  const base = ready
    ? coverScale(natural.w, natural.h, viewport.w, viewport.h)
    : 1;
  const scale = base * zoom;
  const imgW = natural.w * scale;
  const imgH = natural.h * scale;

  const dialog = (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Crop">
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.headTitle}>Crop</span>
        </div>

        <div
          ref={viewportRef}
          className={styles.viewport}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            className={styles.image}
            draggable={false}
            onLoad={onImageLoad}
            style={
              ready
                ? {
                    width: imgW,
                    height: imgH,
                    left: viewport.w / 2 - imgW / 2 + offset.x,
                    top: viewport.h / 2 - imgH / 2 + offset.y,
                  }
                : undefined
            }
          />
          <div className={styles.frame} aria-hidden />
        </div>

        <div className={styles.zoomRow}>
          <ZoomOut size={14} strokeWidth={2.25} aria-hidden />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            disabled={!ready || busy}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <ZoomIn size={14} strokeWidth={2.25} aria-hidden />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Batal"
            title="Batal"
            disabled={busy}
            onClick={onCancel}
          >
            <X size={16} strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconOk}`}
            aria-label="OK"
            title="OK"
            disabled={!ready || busy}
            onClick={confirm}
          >
            <Check size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(dialog, document.body);
}
