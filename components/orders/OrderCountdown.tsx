"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/orders/orders.module.css";

type OrderCountdownProps = {
  expiresAt: string | null;
  className?: string;
};

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

export function OrderCountdown({ expiresAt, className }: OrderCountdownProps) {
  const router = useRouter();
  const endMs = expiresAt
    ? new Date(expiresAt).getTime()
    : Date.now() + 60 * 60 * 1000;
  const [now, setNow] = useState(() => Date.now());
  const remain = endMs - now;
  const urgent = remain > 0 && remain < 5 * 60 * 1000;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (remain > 0) return;
    router.refresh();
  }, [remain, router]);

  if (remain <= 0) {
    return (
      <span className={`${styles.tick} ${styles.tickDead} ${className ?? ""}`}>
        00:00
      </span>
    );
  }

  return (
    <span
      className={`${styles.tick} ${urgent ? styles.tickUrgent : ""} ${className ?? ""}`}
      aria-label={`Sisa ${formatRemain(remain)}`}
    >
      {formatRemain(remain)}
    </span>
  );
}
