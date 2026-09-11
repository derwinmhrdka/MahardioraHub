"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";
import {
  acceptOrderAction,
  confirmBankTransferAction,
  rejectOrderAction,
  rejectPendingBankTransferAction,
} from "@/app/admin/(dashboard)/orders/actions";
import styles from "./AdminOrderActions.module.css";

function SubmitBtn({
  label,
  className,
  icon,
}: {
  label: string;
  className: string;
  icon: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={label}
      title={label}
    >
      {pending ? "..." : icon}
      <span>{pending ? "..." : label}</span>
    </button>
  );
}

type AdminOrderActionsProps = {
  orderId: string;
  forceRejectOpen?: boolean;
  mode?: "progress" | "bankPending";
  canConfirm?: boolean;
};

export function AdminOrderActions({
  orderId,
  forceRejectOpen = false,
  mode = "progress",
  canConfirm = true,
}: AdminOrderActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(forceRejectOpen);
  const rejectAction =
    mode === "bankPending"
      ? rejectPendingBankTransferAction
      : rejectOrderAction;
  const confirmAction =
    mode === "bankPending" ? confirmBankTransferAction : acceptOrderAction;
  const confirmLabel = mode === "bankPending" ? "Konfirmasi" : "Terima";

  if (rejectOpen) {
    return (
      <form action={rejectAction} className={styles.rejectForm}>
        <input type="hidden" name="orderId" value={orderId} />
        <input
          name="reason"
          className={styles.reason}
          placeholder="Alasan"
          required
          maxLength={500}
          autoFocus
          aria-label="Alasan"
        />
        <div className={styles.rejectRow}>
          <SubmitBtn
            label="Tolak"
            className={styles.btnDanger}
            icon={<X size={14} strokeWidth={2.5} aria-hidden />}
          />
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => setRejectOpen(false)}
            aria-label="Batal"
          >
            Batal
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.row}>
      {canConfirm ? (
        <form action={confirmAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <SubmitBtn
            label={confirmLabel}
            className={styles.btnOk}
            icon={<Check size={14} strokeWidth={2.5} aria-hidden />}
          />
        </form>
      ) : (
        <p className={styles.waitHint}>Menunggu bukti</p>
      )}
      <button
        type="button"
        className={styles.btnDanger}
        onClick={() => setRejectOpen(true)}
        aria-label="Tolak"
        title="Tolak"
      >
        <X size={14} strokeWidth={2.5} aria-hidden />
        <span>Tolak</span>
      </button>
    </div>
  );
}
