import { ProductKind } from "@prisma/client";
import type { Metadata } from "next";
import { CollectionPromoBanner } from "@/components/CollectionPromoBanner";
import { FlashSaleStrip } from "@/components/FlashSaleStrip";
import { PreOrderStrip } from "@/components/PreOrderStrip";
import { ProductBrowse } from "@/components/ProductBrowse";
import { SiteHeader } from "@/components/SiteHeader";
import { listCategories } from "@/lib/categories";
import { getActiveFlashSalePublic } from "@/lib/flash-sale";
import {
  getTodayPreOrderPublic,
  mapActivePreOrderByProductId,
} from "@/lib/pre-order";
import {
  listActiveSecondhand,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";
import { buildShareMetadata } from "@/lib/seo";
import {
  getCollectionBanner,
  getSettings,
  siteOrigin,
} from "@/lib/settings";

type PageProps = {
  searchParams: Promise<{
    area?: string;
    category?: string;
    platform?: string;
  }>;
};

/** Public catalog — data cached; header auth isolated via SiteHeader Suspense. */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildShareMetadata({
    title: settings.siteName,
    description: `${settings.siteName} — Collection`,
    url: siteOrigin(),
    siteName: settings.siteName,
  });
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = await searchParams;
  const area = query.area?.trim() || null;
  const categorySlug = query.category?.trim() || null;
  const platform = query.platform?.trim() || null;

  const [
    categories,
    areas,
    platforms,
    products,
    flashSale,
    preOrder,
    preOrderMap,
    bannerImages,
  ] = await Promise.all([
    listCategories(),
    listStoreAreas(ProductKind.secondhand),
    listPlatforms(ProductKind.secondhand),
    listActiveSecondhand({
      storeArea: area,
      categorySlug,
      platform,
    }),
    getActiveFlashSalePublic(),
    getTodayPreOrderPublic(),
    mapActivePreOrderByProductId(),
    getCollectionBanner(),
  ]);

  const items = products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    discountPercent: product.discountPercent,
    stock: product.stock,
    shortNote: product.shortNote,
    imageUrl: product.imageUrl,
    categoryName: product.category.name,
    storeArea: product.storeArea,
    href: `/secondhand/${product.id}`,
    isPreOrder: preOrderMap.has(product.id),
  }));

  return (
    <div className="section-secondhand">
      <SiteHeader active="secondhand" />
      {bannerImages.length > 0 ? (
        <CollectionPromoBanner images={bannerImages} />
      ) : null}
      <main className="container">
        <h1 className="page-title">Collection</h1>
        {flashSale ? (
          <FlashSaleStrip
            endsAt={flashSale.endsAt}
            startedAt={flashSale.startedAt}
            items={flashSale.items}
          />
        ) : null}
        {preOrder ? (
          <PreOrderStrip
            lastOrderDate={preOrder.lastOrderDate}
            items={preOrder.items}
          />
        ) : null}
        <ProductBrowse
          mode="secondhand"
          label="Collection"
          items={items}
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeCategory={categorySlug}
          activeArea={area}
          activePlatform={platform}
          basePath="/"
          emptyText="Belum ada collection"
        />
      </main>
    </div>
  );
}
