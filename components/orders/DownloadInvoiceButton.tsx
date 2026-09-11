"use client";

import { Download } from "lucide-react";

type DownloadInvoiceButtonProps = {
  className?: string;
  label?: string;
};

/** Opens the system print dialog so the user can Save as PDF. */
export function DownloadInvoiceButton({
  className,
  label = "Download",
}: DownloadInvoiceButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const root = document.documentElement;
        root.classList.add("printing-invoice");

        const cleanup = () => {
          root.classList.remove("printing-invoice");
          window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);

        // Safari / some WebViews fire late or skip afterprint
        window.setTimeout(cleanup, 60_000);
        window.print();
      }}
      aria-label="Download invoice"
      title="Download / cetak PDF"
    >
      <Download size={16} strokeWidth={2.25} aria-hidden />
      {label}
    </button>
  );
}
