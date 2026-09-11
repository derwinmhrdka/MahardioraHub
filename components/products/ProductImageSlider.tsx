"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { Images, X } from "lucide-react";
import { productImageUrl } from "@/lib/image-url";
import styles from "./ProductImageSlider.module.css";

type ProductImageSliderProps = {
  images: string[];
  alt?: string;
};

const SWIPE_MIN = 40;

export function ProductImageSlider({
  images,
  alt = "",
}: ProductImageSliderProps) {
  const thumbs = images
    .map((url) => productImageUrl(url, 600) ?? url)
    .filter(Boolean);
  const full = images
    .map((url) => productImageUrl(url, 1200) ?? url)
    .filter(Boolean);

  const [index, setIndex] = useState(0);
  const [bounce, setBounce] = useState<"left" | "right" | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);
  const count = thumbs.length;
  const multi = count > 1;
  const current = count === 0 ? 0 : Math.min(index, count - 1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!multi) return;
      if (e.key === "ArrowLeft") {
        setBounce("left");
        setIndex((i) => (i === 0 ? count - 1 : i - 1));
        window.setTimeout(() => setBounce(null), 380);
      }
      if (e.key === "ArrowRight") {
        setBounce("right");
        setIndex((i) => (i === count - 1 ? 0 : i + 1));
        window.setTimeout(() => setBounce(null), 380);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, multi, count]);

  function go(next: number, dir: "left" | "right") {
    setBounce(dir);
    setIndex(next);
    window.setTimeout(() => setBounce(null), 380);
  }

  function prevSlide() {
    if (!multi) return;
    go(current === 0 ? count - 1 : current - 1, "left");
  }

  function nextSlide() {
    if (!multi) return;
    go(current === count - 1 ? 0 : current + 1, "right");
  }

  function onPointerDown(clientX: number) {
    startX.current = clientX;
    moved.current = false;
  }

  function onPointerMove(clientX: number) {
    if (startX.current == null) return;
    if (Math.abs(clientX - startX.current) >= SWIPE_MIN) {
      moved.current = true;
    }
  }

  function onPointerUp(clientX: number, allowOpen: boolean) {
    if (startX.current == null) return;
    const delta = clientX - startX.current;
    const didSwipe = Math.abs(delta) >= SWIPE_MIN;
    startX.current = null;

    if (multi && didSwipe) {
      if (delta > 0) prevSlide();
      else nextSlide();
      return;
    }

    if (allowOpen && !moved.current && !didSwipe) {
      setOpen(true);
    }
  }

  if (count === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.placeholder}>Tidak ada gambar</div>
      </div>
    );
  }

  const bounceClass =
    bounce === "left"
      ? styles.bounceLeft
      : bounce === "right"
        ? styles.bounceRight
        : "";

  const swipeHandlers = {
    onTouchStart: (e: TouchEvent) => {
      onPointerDown(e.changedTouches[0]?.clientX ?? 0);
    },
    onTouchMove: (e: TouchEvent) => {
      onPointerMove(e.changedTouches[0]?.clientX ?? 0);
    },
    onTouchEnd: (e: TouchEvent, allowOpen: boolean) => {
      onPointerUp(e.changedTouches[0]?.clientX ?? 0, allowOpen);
    },
    onMouseDown: (e: MouseEvent) => {
      onPointerDown(e.clientX);
    },
    onMouseMove: (e: MouseEvent) => {
      if (e.buttons === 1) onPointerMove(e.clientX);
    },
    onMouseUp: (e: MouseEvent, allowOpen: boolean) => {
      onPointerUp(e.clientX, allowOpen);
    },
    onMouseLeave: () => {
      startX.current = null;
    },
  };

  const lightbox =
    mounted && open
      ? createPortal(
          <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label={alt || "Gambar"}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              className={styles.close}
              aria-label="Tutup"
              onClick={() => setOpen(false)}
            >
              <X size={18} strokeWidth={2.25} aria-hidden />
            </button>

            <div
              className={`${styles.lightboxStage} ${multi ? styles.swipeable : ""}`}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={swipeHandlers.onTouchStart}
              onTouchMove={swipeHandlers.onTouchMove}
              onTouchEnd={(e) => swipeHandlers.onTouchEnd(e, false)}
              onMouseDown={swipeHandlers.onMouseDown}
              onMouseMove={swipeHandlers.onMouseMove}
              onMouseUp={(e) => swipeHandlers.onMouseUp(e, false)}
              onMouseLeave={swipeHandlers.onMouseLeave}
            >
              <div className={`${styles.lightboxFrame} ${bounceClass}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={full[current]}
                  src={full[current]}
                  alt={alt}
                  className={styles.lightboxImage}
                  draggable={false}
                />
              </div>
            </div>

            {multi ? (
              <div className={styles.lightboxCount} aria-live="polite">
                <Images size={12} strokeWidth={2.25} aria-hidden />
                <span>
                  {current + 1}/{count}
                </span>
              </div>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        className={`${styles.wrap} ${styles.clickable} ${multi ? styles.swipeable : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Buka gambar"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={(e) => swipeHandlers.onTouchEnd(e, true)}
        onMouseDown={swipeHandlers.onMouseDown}
        onMouseMove={swipeHandlers.onMouseMove}
        onMouseUp={(e) => swipeHandlers.onMouseUp(e, true)}
        onMouseLeave={swipeHandlers.onMouseLeave}
      >
        <div className={`${styles.frame} ${bounceClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={thumbs[current]}
            src={thumbs[current]}
            alt={alt}
            className={styles.image}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>

        {multi ? (
          <div className={styles.count} aria-label={`${count} gambar`}>
            <Images size={12} strokeWidth={2.25} aria-hidden />
            <span>{count}</span>
          </div>
        ) : null}
      </div>
      {lightbox}
    </>
  );
}
