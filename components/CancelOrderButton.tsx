"use client";

import { useFormStatus } from "react-dom";
import { cancelOrderAction } from "@/app/orders/actions";
import orderStyles from "@/app/orders/orders.module.css";

function CancelSubmit({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className || orderStyles.btnDanger}
      disabled={pending}
    >
      {pending ? "..." : label}
    </button>
  );
}

type CancelOrderButtonProps = {
  orderId: string;
  label?: string;
  className?: string;
};

export function CancelOrderButton({
  orderId,
  label = "Cancel",
  className,
}: CancelOrderButtonProps) {
  return (
    <form
      action={cancelOrderAction}
      className={orderStyles.cancelForm}
      onSubmit={(e) => {
        if (!window.confirm("Cancel order?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <CancelSubmit label={label} className={className} />
    </form>
  );
}
