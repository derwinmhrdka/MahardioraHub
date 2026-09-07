import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Tag } from "lucide-react";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import styles from "@/components/ProductDetail.module.css";
import { formatRupiah } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { buildWhatsAppLink, getSettings } from "@/lib/settings";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SecondhandItemPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const product = await getProduct(productId);
  if (!product || product.kind !== "secondhand" || !product.isActive) {
    notFound();
  }

  const settings = await getSettings();
  const whatsappHref = buildWhatsAppLink(
    settings.whatsappNumber,
    product.title
  );

  return (
    <div className="section-secondhand">
      <Header siteName={settings.siteName} active="secondhand" />
      <main className="container">
        <article className={styles.detail}>
          <div className={styles.imageWrap}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className={styles.image} />
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
              <span className={styles.metaItem}>
                <CheckCircle2 size={11} strokeWidth={2} aria-hidden />
                Tersedia
              </span>
            </div>
            <WhatsAppButton href={whatsappHref} label="Chat WA" />
          </div>
        </article>
      </main>
    </div>
  );
}
