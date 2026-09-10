"use client";

import { useFormStatus } from "react-dom";
import {
  checkoutInvoiceAction,
  checkoutQrisAction,
} from "@/app/cart/checkout-actions";
import styles from "./CartCheckoutActions.module.css";

type CartCheckoutActionsProps = {
  whatsappHref: string | null;
  xenditEnabled: boolean;
};

function PendingLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "..." : label}</>;
}

export function CartCheckoutActions({
  whatsappHref,
  xenditEnabled,
}: CartCheckoutActionsProps) {
  return (
    <div className={styles.actions}>
      {xenditEnabled ? (
        <>
          <form action={checkoutInvoiceAction} className={styles.form}>
            <button type="submit" className={`${styles.btn} ${styles.invoice}`}>
              <PendingLabel label="Invoice" />
            </button>
          </form>
          <form action={checkoutQrisAction} className={styles.form}>
            <button type="submit" className={`${styles.btn} ${styles.qris}`}>
              <PendingLabel label="QRIS" />
            </button>
          </form>
        </>
      ) : null}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          className={`${styles.btn} ${styles.wa}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WA
        </a>
      ) : null}
    </div>
  );
}
