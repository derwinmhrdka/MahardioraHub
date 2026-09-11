"use client";

import { useEffect, useRef } from "react";

/** Open WhatsApp once when arriving from cash checkout (?contact=1). */
export function OpenWhatsAppOnce({ href }: { href: string }) {
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current || !href) return;
    opened.current = true;
    window.open(href, "_blank", "noopener,noreferrer");
  }, [href]);

  return null;
}
