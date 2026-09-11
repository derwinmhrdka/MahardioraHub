"use client";

import { useFormStatus } from "react-dom";
import { Banknote, ChevronRight, Landmark, QrCode } from "lucide-react";
import {
  checkoutBankTransferAction,
  checkoutCashAction,
  checkoutQrisAction,
} from "@/app/cart/checkout-actions";
import styles from "./PaymentMethods.module.css";

type BuyerFields = {
  name: string;
  whatsapp: string;
  address: string;
};

type PaymentMethodsProps = {
  qrisEnabled: boolean;
  bankTransferEnabled: boolean;
  buyer: BuyerFields;
  disabled?: boolean;
};

function PendingLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "..." : label}</>;
}

function BuyerHiddens({ buyer }: { buyer: BuyerFields }) {
  return (
    <>
      <input type="hidden" name="buyerName" value={buyer.name} />
      <input type="hidden" name="buyerWhatsapp" value={buyer.whatsapp} />
      <input type="hidden" name="buyerAddress" value={buyer.address} />
    </>
  );
}

export function PaymentMethods({
  qrisEnabled,
  bankTransferEnabled,
  buyer,
  disabled = false,
}: PaymentMethodsProps) {
  return (
    <div className={`${styles.list} ${disabled ? styles.listDisabled : ""}`}>
      {qrisEnabled ? (
        <form action={checkoutQrisAction} className={styles.form}>
          <BuyerHiddens buyer={buyer} />
          <button type="submit" className={styles.row} disabled={disabled}>
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

      {bankTransferEnabled ? (
        <form action={checkoutBankTransferAction} className={styles.form}>
          <BuyerHiddens buyer={buyer} />
          <button type="submit" className={styles.row} disabled={disabled}>
            <span className={`${styles.icon} ${styles.bank}`} aria-hidden>
              <Landmark size={16} strokeWidth={2.25} />
            </span>
            <span className={styles.label}>
              <PendingLabel label="Transfer Bank" />
            </span>
            <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </form>
      ) : (
        <div className={styles.form}>
          <button
            type="button"
            className={`${styles.row} ${styles.rowDisabled}`}
            disabled
            aria-disabled="true"
            title="Belum ada rekening"
          >
            <span className={`${styles.icon} ${styles.bank}`} aria-hidden>
              <Landmark size={16} strokeWidth={2.25} />
            </span>
            <span className={styles.label}>
              Transfer Bank
              <span className={styles.sub}>Belum tersedia</span>
            </span>
          </button>
        </div>
      )}

      <form action={checkoutCashAction} className={styles.form}>
        <BuyerHiddens buyer={buyer} />
        <button type="submit" className={styles.row} disabled={disabled}>
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
