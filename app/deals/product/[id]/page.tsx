import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Store, Tag } from "lucide-react";
import { DealCta } from "@/components/DealCta";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { ProductImageSlider } from "@/components/ProductImageSlider";
import { ProductNote } from "@/components/ProductNote";
import styles from "@/components/ProductDetail.module.css";
import { formatRupiah } from "@/lib/format";
import { productImages } from "@/lib/product-images";
import { getProduct, getRelatedDeals } from "@/lib/products";
import { buildShareMetadata } from "@/lib/seo";
import { getSettings, productPageUrl } from "@/lib/settings";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) return {};

  const product = await getProduct(productId);
  if (!product || product.kind !== "deal" || !product.isActive) return {};

  const settings = await getSettings();
  const images = productImages(product);
  return buildShareMetadata({
    title: product.title,
    description: product.shortNote,
    url: productPageUrl("deal", product.id),
    imageUrl: images[0] ?? null,
    siteName: settings.siteName,
  });
}

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
  return (
    <div className="section-deals">
      <Header siteName={settings.siteName} active="deals" />
      <main className="container">
        <article className={styles.detail}>
          <ProductImageSlider images={productImages(product)} alt={product.title} />
          <div className={styles.meta}>
            <p className={styles.price}>{formatRupiah(product.price)}</p>
            <h1>{product.title}</h1>
            {product.shortNote ? (
              <ProductNote text={product.shortNote} className={styles.note} />
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
            <div className={styles.actions}>
              <DealCta
                productId={product.id}
                shopName={product.shopName}
                affiliateLink={product.affiliateLink}
              />
            </div>
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
