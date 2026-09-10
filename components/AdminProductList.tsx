import Link from "next/link";
import { Eye, EyeOff, ImageOff, Package, Pencil, Plus, Recycle } from "lucide-react";
import { ProductCsvMenu } from "@/components/ProductCsvMenu";
import { ProductRowActions } from "@/components/ProductRowActions";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { salePrice } from "@/lib/pricing";
import styles from "./AdminProductList.module.css";

type ProductRow = {
  id: number;
  title: string;
  kind: "deal" | "secondhand" | string;
  price: number;
  discountPercent: number;
  isActive: boolean;
  storeArea: string | null;
  categoryName: string;
  imageUrl: string | null;
};

type AdminTab = "deal" | "secondhand";

type AdminProductListProps = {
  products: ProductRow[];
  activeTab: AdminTab;
  hideAction: (formData: FormData) => void | Promise<void>;
  showAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  notice?: string | null;
  noticeTone?: "ok" | "error";
};

function tabHref(tab: AdminTab) {
  return tab === "deal" ? "/admin/products" : "/admin/products?tab=secondhand";
}

export function AdminProductList({
  products,
  activeTab,
  hideAction,
  showAction,
  deleteAction,
  notice = null,
  noticeTone = "ok",
}: AdminProductListProps) {
  const filtered = products.filter((product) => product.kind === activeTab);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Produk</h1>
        <ProductCsvMenu />
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Jenis">
        <Link
          href={tabHref("deal")}
          role="tab"
          aria-selected={activeTab === "deal"}
          aria-label="My Picks"
          title="My Picks"
          className={`${styles.tab} ${activeTab === "deal" ? styles.tabOn : ""}`}
        >
          <Package size={14} strokeWidth={2.25} aria-hidden />
        </Link>
        <Link
          href={tabHref("secondhand")}
          role="tab"
          aria-selected={activeTab === "secondhand"}
          aria-label="Collection"
          title="Collection"
          className={`${styles.tab} ${activeTab === "secondhand" ? styles.tabOn : ""}`}
        >
          <Recycle size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      {notice ? (
        <p
          className={
            noticeTone === "error" ? styles.noticeError : styles.notice
          }
        >
          {notice}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className={styles.empty}>Belum ada produk</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((product) => {
            const total =
              product.kind === "secondhand"
                ? salePrice(product.price, product.discountPercent)
                : product.price;

            return (
              <li key={product.id} className={styles.card}>
                <div className={styles.thumb}>
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        productImageUrl(product.imageUrl, 120) ?? product.imageUrl
                      }
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.thumbEmpty} aria-hidden>
                      <ImageOff size={11} strokeWidth={1.75} />
                    </span>
                  )}
                </div>

                <div className={styles.cardMain}>
                  <p className={styles.cardTitle}>{product.title}</p>
                  <p className={styles.line}>
                    <span className={styles.price}>{formatRupiah(total)}</span>
                    <span className={styles.dot}>·</span>
                    {product.isActive ? (
                      <span className={styles.on} title="Tampil" aria-label="Tampil">
                        <Eye size={13} strokeWidth={2.25} aria-hidden />
                      </span>
                    ) : (
                      <span className={styles.off} title="Hidden" aria-label="Hidden">
                        <EyeOff size={13} strokeWidth={2.25} aria-hidden />
                      </span>
                    )}
                  </p>
                  <p className={styles.detail}>
                    {product.categoryName}
                    {product.storeArea ? ` · ${product.storeArea}` : ""}
                  </p>
                </div>

                <div className={styles.rowActions}>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className={styles.iconBtn}
                    title="Edit"
                    aria-label={`Edit ${product.title}`}
                  >
                    <Pencil size={12} strokeWidth={2} />
                  </Link>
                  <ProductRowActions
                    productId={product.id}
                    title={product.title}
                    isActive={product.isActive}
                    hideAction={hideAction}
                    showAction={showAction}
                    deleteAction={deleteAction}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/admin/products/new"
        className={styles.fab}
        aria-label="Tambah produk"
      >
        <Plus size={14} strokeWidth={2} />
      </Link>
    </div>
  );
}
