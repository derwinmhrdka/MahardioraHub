"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type CancelLeaveLinkProps = {
  orderId: string;
  href?: string;
  className?: string;
  "aria-label"?: string;
  title?: string;
  children: ReactNode;
};

/** Back / leave unpaid checkout → cancel pending order then navigate. */
export function CancelLeaveLink({
  orderId,
  href = "/",
  className,
  children,
  ...rest
}: CancelLeaveLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      {...rest}
      onClick={() => {
        startTransition(async () => {
          try {
            await fetch(`/api/checkout/${orderId}/cancel`, {
              method: "POST",
              keepalive: true,
            });
          } catch {
            // still leave
          }
          router.replace(href);
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}
