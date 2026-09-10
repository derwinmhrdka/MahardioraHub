"use client";

import { useEffect, useRef, useState } from "react";
import { productImageUrl } from "@/lib/image-url";
import styles from "./CollectionPromoBanner.module.css";

type CollectionPromoBannerProps = {
  images: string[];
};

const SLIDE_MS = 4500;

export function CollectionPromoBanner({ images }: CollectionPromoBannerProps) {
  const slides = images.map((url) => url.trim()).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, slides[0]]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  function go(next: number) {
    const len = slides.length;
    setIndex(((next % len) + len) % len);
  }

  return (
    <section
      className={styles.wrap}
      aria-roledescription="carousel"
      aria-label="Banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start == null || slides.length < 2) return;
        const end = e.changedTouches[0]?.clientX;
        if (end == null) return;
        const delta = end - start;
        if (Math.abs(delta) < 40) return;
        go(delta < 0 ? index + 1 : index - 1);
      }}
    >
      <div className={styles.frame}>
        <div
          className={styles.track}
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {slides.map((url, i) => {
            const src = productImageUrl(url, 1200) ?? url;
            return (
              <div
                key={`${url}-${i}`}
                className={styles.slide}
                aria-hidden={i !== index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className={styles.image}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className={styles.dots} role="tablist" aria-label="Slide">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}`}
              className={`${styles.dot} ${i === index ? styles.dotOn : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
