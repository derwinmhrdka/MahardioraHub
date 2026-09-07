import { notFound } from "next/navigation";
import { MapPin, Store, Tag } from "lucide-react";
import { DealCta } from "@/components/DealCta";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import styles from "@/components/ProductDetail.module.css";
import { formatRupiah } from "@/lib/format";
import { productImageUrl } from "@/lib/image-url";
import { getProduct, getRelatedDeals } from "@/lib/products";
import { getSettings } from "@/lib/settings";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DealProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const product = await getProduct(productId);
  if (!product || product.kind !== "deal" || !product.isActive) notFound();

  const [settings, related] = await Promise.all([
    getSettings(),
    getRelatedDeals(product.id, product.categoryId),
  ]);
  const imageSrc = productImageUrl(product.imageUrl, 600);

  return (
    <div className="section-deals">
      <Header siteName={settings.siteName} active="deals" />
      <main className="container">
        <article className={styles.detail}>
          <div className={styles.imageWrap}>
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                className={styles.image}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className={styles.placeholder}>Tidak ada gambar</div>
            )}
          </div>
          <div className={styles.meta}>
            <p className={styles.price}>{formatRupiah(product.price)}</p>
            <h1>{product.title}</h1>
            {product.shortNote ? (
              <p className={styles.note}>{product.shortNote}</p>
            ) : null}
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <Tag size={11} strokeWidth={2} aria-hidden />
                {product.category.name}
              </span>
              {product.storeArea ? (
                <span className={styles.metaItem}>
                  <MapPin size={11} strokeWidth={2} aria-hidden />
                  {product.storeArea}
                </span>
              ) : null}
              {product.shopName ? (
                <span className={styles.metaItem}>
                  <Store size={11} strokeWidth={2} aria-hidden />
                  {product.shopName}
                </span>
              ) : null}
            </div>
            <DealCta
              productId={product.id}
              shopName={product.shopName}
              affiliateLink={product.affiliateLink}
            />
          </div>
        </article>

        {related.length > 0 ? (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>Mirip</h2>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  shortNote={item.shortNote}
                  imageUrl={item.imageUrl}
                  categoryName={item.category.name}
                  storeArea={item.storeArea}
                  href={`/deals/product/${item.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
