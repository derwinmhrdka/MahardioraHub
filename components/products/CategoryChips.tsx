"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { DinoPaw } from "@/components/DinoPaw";
import {
  Baby,
  CalendarClock,
  Home,
  Search,
  Smartphone,
  Tag,
  X,
} from "lucide-react";
import { withFilters } from "@/lib/urls";
import styles from "./CategoryChips.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type CategoryChipsProps = {
  categories: Category[];
  activeSlug?: string | null;
  mode?: "deals" | "secondhand";
  basePath?: string;
  area?: string | null;
  platform?: string | null;
  activePreOrder?: boolean;
  showPreOrder?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
};

function iconForSlug(slug: string) {
  const key = slug.toLowerCase();
  if (key.includes("electr")) return Smartphone;
  if (key.includes("home") || key.includes("rumah")) return Home;
  if (key.includes("kid") || key.includes("baby") || key.includes("anak")) {
    return Baby;
  }
  return Tag;
}

export function CategoryChips({
  categories,
  activeSlug = null,
  mode = "deals",
  basePath = mode === "secondhand" ? "/" : "/picks",
  area = null,
  platform = null,
  activePreOrder = false,
  showPreOrder = false,
  query = "",
  onQueryChange,
}: CategoryChipsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allHref =
    mode === "secondhand"
      ? withFilters(basePath, { area, platform })
      : withFilters("/picks", { area, platform });

  const preOrderHref =
    mode === "secondhand"
      ? withFilters(basePath, { area, platform, preOrder: true })
      : allHref;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={clsx(styles.wrap, open && styles.searchOpen)}
    >
      <div className={clsx(styles.searchSlot, open && styles.searchSlotOpen)}>
        {open ? (
          <div className={styles.searchField}>
            <Search size={14} strokeWidth={2.25} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              className={styles.searchInput}
              value={query}
              placeholder="Cari"
              aria-label="Cari"
              onChange={(e) => onQueryChange?.(e.target.value)}
            />
            {query ? (
              <button
                type="button"
                className={styles.clear}
                aria-label="Clear"
                title="Clear"
                onClick={() => {
                  onQueryChange?.("");
                  inputRef.current?.focus();
                }}
              >
                <X size={12} strokeWidth={2.5} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className={styles.searchBtn}
            aria-label="Cari"
            title="Cari"
            onClick={() => setOpen(true)}
          >
            <Search size={14} strokeWidth={2.25} aria-hidden />
          </button>
        )}
      </div>

      <nav
        className={clsx(styles.chips, open && styles.chipsMin)}
        aria-label="Kategori"
        aria-hidden={open}
      >
        <Link
          href={allHref}
          className={clsx(
            styles.chip,
            activeSlug == null && !activePreOrder && styles.active
          )}
          tabIndex={open ? -1 : undefined}
        >
          <DinoPaw size={11} />
          Semua
        </Link>
        {showPreOrder && mode === "secondhand" ? (
          <Link
            href={preOrderHref}
            className={clsx(
              styles.chip,
              styles.chipPreOrder,
              activePreOrder && styles.active
            )}
            tabIndex={open ? -1 : undefined}
          >
            <CalendarClock size={10} strokeWidth={2} aria-hidden />
            Pre Order
          </Link>
        ) : null}
        {categories.map((category) => {
          const Icon = iconForSlug(category.slug);
          const label = category.name.split(/\s+/)[0] ?? category.name;
          const href =
            mode === "secondhand"
              ? withFilters(basePath, {
                  category: category.slug,
                  area,
                  platform,
                })
              : withFilters(`/deals/${category.slug}`, { area, platform });

          return (
            <Link
              key={category.id}
              href={href}
              className={clsx(
                styles.chip,
                !activePreOrder &&
                  activeSlug === category.slug &&
                  styles.active
              )}
              tabIndex={open ? -1 : undefined}
            >
              <Icon size={10} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
