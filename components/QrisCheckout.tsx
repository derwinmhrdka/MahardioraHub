"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import styles from "./QrisCheckout.module.css";

type QrisCheckoutProps = {
  orderId: string;
  amount: number;
  qrString: string;
  expiresAt: string | null;
  initialStatus: "pending" | "paid" | "expired" | "failed";
};

export function QrisCheckout({
  orderId,
  amount,
  qrString,
  expiresAt,
  initialStatus,
}: QrisCheckoutProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrString)}`;

  useEffect(() => {
    if (status !== "pending") return;

    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/${orderId}/status`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (data.status === "paid") {
          setStatus("paid");
          router.replace(`/checkout/success?order=${orderId}`);
        } else if (data.status === "expired" || data.status === "failed") {
          setStatus(data.status);
        }
      } catch {
        // ignore transient errors
      }
    }, 3000);

    return () => window.clearInterval(id);
  }, [orderId, router, status]);

  return (
    <div className={styles.wrap}>
      <p className={styles.amount}>{formatRupiah(amount)}</p>
      <p className={styles.hint}>Scan QRIS</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrImg} alt="QRIS" className={styles.qr} width={280} height={280} />
      {expiresAt ? (
        <p className={styles.meta}>
          Exp {new Date(expiresAt).toLocaleTimeString("id-ID")}
        </p>
      ) : null}
      <p className={styles.status} aria-live="polite">
        {status === "pending"
          ? "Menunggu..."
          : status === "paid"
            ? "Paid"
            : status === "expired"
              ? "Expired"
              : "Failed"}
      </p>
    </div>
  );
}
