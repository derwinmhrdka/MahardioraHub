"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  FolderTree,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Recycle,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import {
  ProductCatalog,
  type CatalogItem,
} from "@/components/ProductCatalog";
import { withFilters } from "@/lib/urls";
import styles from "./ProductBrowse.module.css";

const STORAGE_KEY = "dealhub-catalog-view";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type ViewMode = "card" | "list";

type ProductBrowseProps = {
  mode: "deals" | "secondhand";
  label: string;
  items: CatalogItem[];
  categories: Category[];
  areas: string[];
  platforms: string[];
  activeCategory?: string | null;
  activeArea?: string | null;
  activePlatform?: string | null;
  activePreOrder?: boolean;
  showPreOrderChip?: boolean;
  basePath: string;
  emptyText: string;
};

export function ProductBrowse({
  mode,
  label,
  items,
  categories,
  areas,
  platforms,
  activeCategory = null,
  activeArea = null,
  activePlatform = null,
  activePreOrder = false,
  showPreOrderChip = false,
  basePath,
  emptyText,
}: ProductBrowseProps) {
  const [view, setView] = useState<ViewMode>("card");
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filterActive = Boolean(activeArea || activePlatform);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = [
        item.title,
        item.shortNote ?? "",
        item.categoryName ?? "",
        item.storeArea ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "card" || saved === "list") setView(saved);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  function chooseView(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  function categoryHref(slug: string | null) {
    if (mode === "secondhand") {
      return withFilters(basePath, {
        category: slug,
        area: activeArea,
        platform: activePlatform,
      });
    }
    if (!slug) {
      return withFilters("/picks", {
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
      preOrder: mode === "secondhand" ? activePreOrder : false,
    });
  }

  function platformHref(platform: string | null) {
    return withFilters(basePath, {
      category: mode === "secondhand" ? activeCategory : null,
      area: activeArea,
      platform,
      preOrder: mode === "secondhand" ? activePreOrder : false,
    });
  }

  const EmptyIcon = mode === "secondhand" ? Recycle : Package;

  return (
    <div className={styles.wrap}>
      <div className={styles.chips}>
        <CategoryChips
          categories={categories}
          activeSlug={activeCategory}
          mode={mode}
          basePath={basePath}
          area={activeArea}
          platform={activePlatform}
          activePreOrder={activePreOrder}
          showPreOrder={showPreOrderChip}
          query={query}
          onQueryChange={setQuery}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty">
          <EmptyIcon size={24} strokeWidth={1.5} aria-hidden />
          <p>{emptyText}</p>
        </div>
      ) : (
        <ProductCatalog label={label} items={filteredItems} view={view} />
      )}

      <nav className={styles.dock} aria-label="Catalog tools">
        <button
          type="button"
          className={clsx(styles.dockBtn, filterActive && styles.dockBtnOn)}
          aria-label="Filter"
          aria-expanded={filterOpen}
          title="Filter"
          onClick={() => setFilterOpen(true)}
        >
          <SlidersHorizontal size={14} strokeWidth={2} aria-hidden />
          <span>Filter</span>
        </button>
        <button
          type="button"
          className={styles.dockBtn}
          aria-label={view === "card" ? "List" : "Card"}
          title={view === "card" ? "List" : "Card"}
          onClick={() => chooseView(view === "card" ? "list" : "card")}
        >
          {view === "card" ? (
            <List size={14} strokeWidth={2} aria-hidden />
          ) : (
            <LayoutGrid size={14} strokeWidth={2} aria-hidden />
          )}
          <span>{view === "card" ? "List" : "Card"}</span>
        </button>
      </nav>

      {filterOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Tutup Filter"
          onClick={() => setFilterOpen(false)}
        />
      ) : null}

      <aside
        className={clsx(styles.drawer, filterOpen && styles.drawerOpen)}
        aria-hidden={!filterOpen}
        aria-label="Filter"
      >
        <div className={styles.drawerTop}>
          <p className={styles.drawerTitle}>Filter</p>
          <button
            type="button"
            className={styles.close}
            aria-label="Tutup"
            onClick={() => setFilterOpen(false)}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <FolderTree size={10} strokeWidth={2} aria-hidden />
              Kategori
            </h2>
            <div className={styles.filterList}>
              <Link
                href={categoryHref(null)}
                className={clsx(
                  styles.link,
                  activeCategory == null && !activePreOrder && styles.active
                )}
                onClick={() => setFilterOpen(false)}
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
                  onClick={() => setFilterOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <MapPin size={10} strokeWidth={2} aria-hidden />
              Area
            </h2>
            <div className={styles.filterList}>
              <Link
                href={areaHref(null)}
                className={clsx(styles.link, activeArea == null && styles.active)}
                onClick={() => setFilterOpen(false)}
              >
                Semua
              </Link>
              {areas.length === 0 ? (
                <p className={styles.emptyText}>Belum ada area</p>
              ) : (
                areas.map((area) => (
                  <Link
                    key={area}
                    href={areaHref(area)}
                    className={clsx(
                      styles.link,
                      activeArea === area && styles.active
                    )}
                    onClick={() => setFilterOpen(false)}
                  >
                    {area}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>
              <Store size={10} strokeWidth={2} aria-hidden />
              Platform
            </h2>
            <div className={styles.filterList}>
              <Link
                href={platformHref(null)}
                className={clsx(
                  styles.link,
                  activePlatform == null && styles.active
                )}
                onClick={() => setFilterOpen(false)}
              >
                Semua
              </Link>
              {platforms.length === 0 ? (
                <p className={styles.emptyText}>Belum ada platform</p>
              ) : (
                platforms.map((platform) => (
                  <Link
                    key={platform}
                    href={platformHref(platform)}
                    className={clsx(
                      styles.link,
                      activePlatform === platform && styles.active
                    )}
                    onClick={() => setFilterOpen(false)}
                  >
                    {platform}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
