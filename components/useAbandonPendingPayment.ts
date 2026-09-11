"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-cancel pending payment if user leaves the page without paying.
 * Skipped after markPaid() / markSafe().
 */
export function useAbandonPendingPayment(
  orderId: string,
  enabled: boolean
) {
  const skipRef = useRef(false);
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  function markSafe() {
    skipRef.current = true;
  }

  useEffect(() => {
    if (!enabled) return;

    function cancelNow() {
      if (skipRef.current) return;
      const id = orderIdRef.current;
      try {
        const ok = navigator.sendBeacon(
          `/api/checkout/${id}/cancel`,
          new Blob([], { type: "application/octet-stream" })
        );
        if (!ok) {
          void fetch(`/api/checkout/${id}/cancel`, {
            method: "POST",
            keepalive: true,
          });
        }
      } catch {
        // ignore
      }
    }

    function onPageHide() {
      cancelNow();
    }

    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled, orderId]);

  return { markSafe };
}
