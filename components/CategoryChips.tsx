import Link from "next/link";
import clsx from "clsx";
import {
  Baby,
  Home,
  LayoutGrid,
  Smartphone,
  Tag,
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
  area?: string | null;
  platform?: string | null;
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
  area = null,
  platform = null,
}: CategoryChipsProps) {
  const allHref =
    mode === "secondhand"
      ? withFilters("/secondhand", { area, platform })
      : withFilters("/", { area, platform });

  return (
    <div className={styles.wrap}>
      <nav className={styles.chips} aria-label="Kategori">
        <Link
          href={allHref}
          className={clsx(styles.chip, activeSlug == null && styles.active)}
        >
          <LayoutGrid size={14} strokeWidth={2} aria-hidden />
          Semua
        </Link>
        {categories.map((category) => {
          const Icon = iconForSlug(category.slug);
          const label = category.name.split(/\s+/)[0] ?? category.name;
          const href =
            mode === "secondhand"
              ? withFilters("/secondhand", {
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
                activeSlug === category.slug && styles.active
              )}
            >
              <Icon size={14} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
