"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileDown,
  FileUp,
} from "lucide-react";
import { importProductsCsvAction } from "@/app/admin/(dashboard)/products/actions";
import styles from "./ProductCsvMenu.module.css";

export function ProductCsvMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Import atau Export CSV"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span>CSV</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <FileUp size={15} strokeWidth={2} aria-hidden />
            Import CSV
          </button>
          <a
            href="/admin/products/export"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FileDown size={15} strokeWidth={2} aria-hidden />
            Export CSV
          </a>
          <a
            href="/admin/products/template"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Download size={15} strokeWidth={2} aria-hidden />
            Download template
          </a>
        </div>
      ) : null}

      <form action={importProductsCsvAction} className={styles.hiddenForm}>
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            if (event.target.files?.length) {
              event.target.form?.requestSubmit();
            }
          }}
        />
      </form>
    </div>
  );
}
