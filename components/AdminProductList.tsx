import Link from "next/link";
import { ImageOff, Pencil, Plus } from "lucide-react";
import { ProductCsvMenu } from "@/components/ProductCsvMenu";
import { ProductRowActions } from "@/components/ProductRowActions";
import { formatRupiah } from "@/lib/format";
import styles from "./AdminProductList.module.css";

type ProductRow = {
  id: number;
  title: string;
  kind: string;
  price: number;
  isActive: boolean;
  storeArea: string | null;
  categoryName: string;
  imageUrl: string | null;
};

type AdminProductListProps = {
  products: ProductRow[];
  hideAction: (formData: FormData) => void | Promise<void>;
  showAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  notice?: string | null;
  noticeTone?: "ok" | "error";
};

export function AdminProductList({
  products,
  hideAction,
  showAction,
  deleteAction,
  notice = null,
  noticeTone = "ok",
}: AdminProductListProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Produk</h1>
        <div className={styles.actions}>
          <ProductCsvMenu />
          <Link href="/admin/products/new" className={styles.addBtn}>
            <Plus size={15} strokeWidth={2} aria-hidden />
            Tambah
          </Link>
        </div>
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

      {products.length === 0 ? (
        <p className={styles.empty}>
          Belum ada produk. Ketuk Tambah untuk membuat.
        </p>
      ) : (
        <ul className={styles.list}>
          {products.map((product) => (
            <li key={product.id} className={styles.card}>
              <div className={styles.thumb}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" />
                ) : (
                  <span className={styles.thumbEmpty} aria-hidden>
                    <ImageOff size={14} strokeWidth={1.75} />
                  </span>
                )}
              </div>

              <div className={styles.cardMain}>
                <p className={styles.cardTitle}>{product.title}</p>
                <p className={styles.line}>
                  <span className={styles.price}>{formatRupiah(product.price)}</span>
                  <span className={styles.dot}>·</span>
                  <span
                    className={
                      product.kind === "deal" ? styles.kindDeal : styles.kindUsed
                    }
                  >
                    {product.kind}
                  </span>
                  <span className={styles.dot}>·</span>
                  <span className={product.isActive ? styles.on : styles.off}>
                    {product.isActive ? "tampil" : "hidden"}
                  </span>
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
                  <Pencil size={15} strokeWidth={2} />
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
          ))}
        </ul>
      )}

      <Link
        href="/admin/products/new"
        className={styles.fab}
        aria-label="Tambah produk"
      >
        <Plus size={18} strokeWidth={2} />
      </Link>
    </div>
  );
}
