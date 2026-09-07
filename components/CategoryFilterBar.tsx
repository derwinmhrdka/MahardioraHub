"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  FolderTree,
  MapPin,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { withFilters } from "@/lib/urls";
import styles from "./CategoryFilterBar.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type CategoryFilterBarProps = {
  mode: "deals" | "secondhand";
  categories: Category[];
  areas: string[];
  platforms: string[];
  activeCategory?: string | null;
  activeArea?: string | null;
  activePlatform?: string | null;
  basePath: string;
};

export function CategoryFilterBar({
  mode,
  categories,
  areas,
  platforms,
  activeCategory = null,
  activeArea = null,
  activePlatform = null,
  basePath,
}: CategoryFilterBarProps) {
  const [open, setOpen] = useState(false);
  const filterActive = Boolean(activeArea || activePlatform);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function categoryHref(slug: string | null) {
    if (mode === "secondhand") {
      return withFilters("/secondhand", {
        category: slug,
        area: activeArea,
        platform: activePlatform,
      });
    }
    if (!slug) {
      return withFilters("/", {
        area: activeArea,
        platform: activePlatform,
      });
    }
    return withFilters(`/deals/${slug}`, {
      area: activeArea,
      platform: activePlatform,
    });
  }

  function areaHref(area: string | null) {
    return withFilters(basePath, {
      category: mode === "secondhand" ? activeCategory : null,
      area,
      platform: activePlatform,
    });
  }

  function platformHref(platform: string | null) {
    return withFilters(basePath, {
      category: mode === "secondhand" ? activeCategory : null,
      area: activeArea,
      platform,
    });
  }

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.chips}>
          <CategoryChips
            categories={categories}
            activeSlug={activeCategory}
            mode={mode}
            area={activeArea}
            platform={activePlatform}
          />
        </div>
        <button
          type="button"
          className={clsx(styles.trigger, filterActive && styles.triggerActive)}
          aria-label="Buka Filter"
          aria-expanded={open}
          title="Filter"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal size={16} strokeWidth={2} />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Tutup Filter"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={clsx(styles.drawer, open && styles.drawerOpen)}
        aria-hidden={!open}
        aria-label="Filter"
      >
        <div className={styles.drawerTop}>
          <p className={styles.drawerTitle}>Filter</p>
          <button
            type="button"
            className={styles.close}
            aria-label="Tutup"
            onClick={() => setOpen(false)}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <FolderTree size={12} strokeWidth={2} aria-hidden />
              Kategori
            </h2>
            <div className={styles.list}>
              <Link
                href={categoryHref(null)}
                className={clsx(
                  styles.link,
                  activeCategory == null && styles.active
                )}
                onClick={() => setOpen(false)}
              >
                Semua
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={categoryHref(category.slug)}
                  className={clsx(
                    styles.link,
                    activeCategory === category.slug && styles.active
                  )}
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <MapPin size={12} strokeWidth={2} aria-hidden />
              Area
            </h2>
            <div className={styles.list}>
              <Link
                href={areaHref(null)}
                className={clsx(
                  styles.link,
                  activeArea == null && styles.active
                )}
                onClick={() => setOpen(false)}
              >
                Semua
              </Link>
              {areas.length === 0 ? (
                <p className={styles.empty}>Belum ada area</p>
              ) : (
                areas.map((area) => (
                  <Link
                    key={area}
                    href={areaHref(area)}
                    className={clsx(
                      styles.link,
                      activeArea === area && styles.active
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {area}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <Store size={12} strokeWidth={2} aria-hidden />
              Platform
            </h2>
            <div className={styles.list}>
              <Link
                href={platformHref(null)}
                className={clsx(
                  styles.link,
                  activePlatform == null && styles.active
                )}
                onClick={() => setOpen(false)}
              >
                Semua
              </Link>
              {platforms.length === 0 ? (
                <p className={styles.empty}>Belum ada platform</p>
              ) : (
                platforms.map((platform) => (
                  <Link
                    key={platform}
                    href={platformHref(platform)}
                    className={clsx(
                      styles.link,
                      activePlatform === platform && styles.active
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {platform}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
