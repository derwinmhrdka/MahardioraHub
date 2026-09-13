"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DinoPaw } from "@/components/DinoPaw";
import { expireFlashSaleAction } from "@/app/secondhand/actions";
import { SmartImage } from "@/components/SmartImage";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import {
  formatDiscountPercent,
  hasDiscount,
  salePrice,
} from "@/lib/pricing";
import styles from "./FlashSaleStrip.module.css";

export type FlashSaleStripItem = {
  productId: number;
  title: string;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  href: string;
};

type FlashSaleStripProps = {
  endsAt: string;
  startedAt: string;
  items: FlashSaleStripItem[];
};

function shortTitle(title: string, maxChars = 16) {
  const text = title.trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}..`;
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FlashSaleStrip({
  endsAt,
  startedAt,
  items,
}: FlashSaleStripProps) {
  const endMs = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const startMs = useMemo(() => new Date(startedAt).getTime(), [startedAt]);
  const totalMs = Math.max(1, endMs - startMs);

  const [now, setNow] = useState(() => Date.now());
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (now < endMs || gone) return;
    setGone(true);
    void expireFlashSaleAction();
  }, [now, endMs, gone]);

  if (gone || items.length === 0) return null;

  const remain = Math.max(0, endMs - now);
  const progress = Math.min(1, Math.max(0, remain / totalMs));

  return (
    <section className={styles.wrap} aria-label="Flash Sale">
      <div className={styles.head}>
        <h2 className={styles.title}>
          <span className={styles.pawIcon} aria-hidden>
            <DinoPaw size={13} />
          </span>
          Flash Sale!
        </h2>
        <span
          className={`${styles.timer} ${remain < 60_000 ? styles.timerUrgent : ""}`}
          aria-live="polite"
        >
          {formatRemain(remain)}
        </span>
      </div>

      <div className={styles.barTrack} aria-hidden>
        <div className={styles.barFill} style={{ width: `${progress * 100}%` }}>
          <span className={styles.barShine} />
        </div>
      </div>

      <ul className={styles.scroller}>
        {items.map((item) => {
          const src = productImageUrl(item.imageUrl, 160);
          const discounted = hasDiscount(item.discountPercent);
          const total = salePrice(item.price, item.discountPercent);
          return (
            <li key={item.productId} className={styles.card}>
              <Link href={item.href} className={styles.link}>
                <span className={styles.thumb}>
                  {src ? (
                    <SmartImage
                      src={src}
                      alt=""
                      fill
                      sizes="120px"
                      style={{ objectFit: "cover" }}
                      fallback={<span className={styles.thumbEmpty}>—</span>}
                    />
                  ) : (
                    <span className={styles.thumbEmpty}>—</span>
                  )}
                  {discounted ? (
                    <span className={styles.discBadge} aria-hidden>
                      -{formatDiscountPercent(item.discountPercent)}%
                    </span>
                  ) : null}
                  <span className={styles.caption}>
                    <span className={styles.cardTitle} title={item.title}>
                      {shortTitle(item.title)}
                    </span>
                    {discounted ? (
                      <span className={styles.wasPrice}>
                        {formatRupiah(item.price)}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className={styles.body}>
                  <span className={styles.nowPrice}>{formatRupiah(total)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
