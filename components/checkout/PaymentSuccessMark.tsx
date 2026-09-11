"use client";

import styles from "./PaymentSuccessMark.module.css";

type PaymentSuccessMarkProps = {
  amountLabel?: string | null;
};

export function PaymentSuccessMark({ amountLabel }: PaymentSuccessMarkProps) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.burst} aria-hidden />
      <div className={styles.ring} aria-hidden>
        <svg
          className={styles.svg}
          viewBox="0 0 72 72"
          width={72}
          height={72}
          fill="none"
        >
          <circle
            className={styles.circle}
            cx="36"
            cy="36"
            r="30"
            strokeWidth="3.5"
          />
          <path
            className={styles.check}
            d="M22 37.5 L31.5 47 L50 26"
            strokeWidth="3.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className={styles.title}>Paid</p>
      {amountLabel ? <p className={styles.amount}>{amountLabel}</p> : null}
    </div>
  );
}
