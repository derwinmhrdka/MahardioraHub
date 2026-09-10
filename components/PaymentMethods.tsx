"use client";

import { useFormStatus } from "react-dom";
import { Banknote, ChevronRight, QrCode } from "lucide-react";
import {
  checkoutCashAction,
  checkoutQrisAction,
} from "@/app/cart/checkout-actions";
import styles from "./PaymentMethods.module.css";

type PaymentMethodsProps = {
  qrisEnabled: boolean;
};

function PendingLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "..." : label}</>;
}

export function PaymentMethods({ qrisEnabled }: PaymentMethodsProps) {
  return (
    <div className={styles.list}>
      {qrisEnabled ? (
        <form action={checkoutQrisAction} className={styles.form}>
          <button type="submit" className={styles.row}>
            <span className={`${styles.icon} ${styles.qris}`} aria-hidden>
              <QrCode size={16} strokeWidth={2.25} />
            </span>
            <span className={styles.label}>
              <PendingLabel label="QRIS" />
            </span>
            <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </form>
      ) : null}

      <form action={checkoutCashAction} className={styles.form}>
        <button type="submit" className={styles.row}>
          <span className={`${styles.icon} ${styles.cash}`} aria-hidden>
            <Banknote size={16} strokeWidth={2.25} />
          </span>
            <span className={styles.label}>
              <PendingLabel label="Cash (Via WhatsApp)" />
            </span>
          <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
        </button>
      </form>
    </div>
  );
}
