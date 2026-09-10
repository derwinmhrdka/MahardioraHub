"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { formatRupiah } from "@/lib/format";
import styles from "./QrisCheckout.module.css";

type QrisCheckoutProps = {
  orderId: string;
  externalId: string;
  amount: number;
  qrString: string;
  expiresAt: string | null;
  initialStatus: "pending" | "paid" | "expired" | "failed";
  canSimulate?: boolean;
};

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function QrisCheckout({
  orderId,
  externalId,
  amount,
  qrString,
  expiresAt,
  initialStatus,
  canSimulate = false,
}: QrisCheckoutProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const endMs = useMemo(() => {
    if (expiresAt) return new Date(expiresAt).getTime();
    return Date.now() + 60 * 60 * 1000;
  }, [expiresAt]);

  const remainMs = endMs - now;
  const urgent = remainMs > 0 && remainMs < 5 * 60 * 1000;
  const timedOut = remainMs <= 0 && status === "pending";

  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrString)}`;

  useEffect(() => {
    if (status !== "pending") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status !== "pending") return;
    if (timedOut) setStatus("expired");
  }, [status, timedOut]);

  async function checkStatus() {
    setChecking(true);
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
      // ignore
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (status !== "pending") return;
    const id = window.setInterval(() => {
      void checkStatus();
    }, 3000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll while pending
  }, [orderId, status]);

  async function copyExternalId() {
    try {
      await navigator.clipboard.writeText(externalId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  async function simulatePay() {
    if (!canSimulate || status !== "pending") return;
    setSimulating(true);
    try {
      const res = await fetch(`/api/checkout/${orderId}/simulate`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { status?: string };
      if (data.status === "paid") {
        setStatus("paid");
        router.replace(`/checkout/success?order=${orderId}`);
      }
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  }

  const statusLabel =
    status === "pending"
      ? "Menunggu pembayaran"
      : status === "paid"
        ? "Paid"
        : status === "expired"
          ? "Expired"
          : "Failed";

  return (
    <div className={styles.wrap}>
      <section className={styles.panel} aria-label="QRIS">
        <div className={styles.topRow}>
          <div>
            <p className={styles.topLabel}>Total</p>
            <p className={styles.amount}>{formatRupiah(amount)}</p>
          </div>
          {status === "pending" ? (
            <div className={styles.timerBlock}>
              <p className={styles.topLabel}>Bayar dalam</p>
              <p
                className={`${styles.timer} ${urgent ? styles.timerUrgent : ""}`}
                aria-live="polite"
              >
                {formatRemain(remainMs)}
              </p>
            </div>
          ) : null}
        </div>

        <div className={styles.qrBlock}>
          <div className={styles.qrFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImg}
              alt="QRIS"
              className={`${styles.qr} ${status !== "pending" ? styles.qrDim : ""}`}
              width={280}
              height={280}
            />
          </div>
          <p className={styles.hint}>Scan QRIS</p>
          <p className={styles.status} aria-live="polite">
            {statusLabel}
          </p>
        </div>

        <button
          type="button"
          className={styles.extId}
          onClick={() => void copyExternalId()}
          title="Copy"
          aria-label="Copy invoice"
        >
          <span className={styles.extText}>
            {copied ? "copied" : externalId}
          </span>
          {copied ? (
            <Check size={12} strokeWidth={2.5} aria-hidden />
          ) : (
            <Copy size={12} strokeWidth={2.5} aria-hidden />
          )}
        </button>
      </section>

      <div className={styles.footer}>
        {status === "pending" ? (
          <>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => void checkStatus()}
              disabled={checking}
            >
              <RefreshCw size={15} strokeWidth={2.4} aria-hidden />
              {checking ? "..." : "Cek"}
            </button>
            <CancelOrderButton
              orderId={orderId}
              className={styles.btnSecondary}
            />
          </>
        ) : null}

        {status === "expired" || status === "failed" ? (
          <Link href="/checkout" className={styles.btnPrimary}>
            Ulang
          </Link>
        ) : null}

        <div className={styles.links}>
          {status === "pending" && canSimulate ? (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => void simulatePay()}
              disabled={simulating}
            >
              {simulating ? "..." : "Sim"}
            </button>
          ) : null}
          <Link href="/orders?tab=pending" className={styles.linkBtn}>
            Order
          </Link>
        </div>
      </div>
    </div>
  );
}
