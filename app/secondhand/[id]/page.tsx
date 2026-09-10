import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, Tag } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Header } from "@/components/Header";
import { ProductImageSlider } from "@/components/ProductImageSlider";
import { ProductNote } from "@/components/ProductNote";
import { ProductPrice } from "@/components/ProductPrice";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import styles from "@/components/ProductDetail.module.css";
import { auth } from "@/auth";
import { productImages } from "@/lib/product-images";
import { getProduct } from "@/lib/products";
import { buildShareMetadata } from "@/lib/seo";
import { buildWhatsAppLink, getSettings, productPageUrl } from "@/lib/settings";

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
  if (!product || product.kind !== "secondhand" || !product.isActive) {
    return {};
  }

  const settings = await getSettings();
  const images = productImages(product);
  return buildShareMetadata({
    title: product.title,
    description: product.shortNote,
    url: productPageUrl("secondhand", product.id),
    imageUrl: images[0] ?? null,
    siteName: settings.siteName,
  });
}

export default async function SecondhandItemPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const product = await getProduct(productId);
  if (!product || product.kind !== "secondhand" || !product.isActive) {
    notFound();
  }

  const settings = await getSettings();
  const session = await auth();
  const whatsappHref = buildWhatsAppLink(settings.whatsappNumber, {
    template: settings.whatsappTemplate,
    productTitle: product.title,
    productLink: productPageUrl("secondhand", product.id),
  });
  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className="container">
        <Link
          href="/"
          className={styles.back}
          aria-label="Kembali"
          title="Kembali"
        >
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
        </Link>
        <article className={styles.detail}>
          <ProductImageSlider images={productImages(product)} alt={product.title} />
          <div className={styles.meta}>
            <ProductPrice
              price={product.price}
              discountPercent={product.discountPercent}
              size="detail"
            />
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
              <span className={styles.metaItem}>
                <Package size={11} strokeWidth={2} aria-hidden />
                {product.stock}
              </span>
            </div>
            <div className={styles.actions}>
              <WhatsAppButton
                href={whatsappHref}
                label="Chat WA"
                disabled={product.stock <= 0}
              />
              <AddToCartButton
                productId={product.id}
                next={`/secondhand/${product.id}`}
                stock={product.stock}
                loggedIn={Boolean(session?.user?.id)}
                imageUrl={productImages(product)[0] ?? null}
              />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
