import { ProductKind } from "@prisma/client";
import type { Metadata } from "next";
import { FlashSaleStrip } from "@/components/FlashSaleStrip";
import { Header } from "@/components/Header";
import { ProductBrowse } from "@/components/ProductBrowse";
import { listCategories } from "@/lib/categories";
import { getActiveFlashSalePublic } from "@/lib/flash-sale";
import {
  listActiveSecondhand,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";
import { buildShareMetadata } from "@/lib/seo";
import { getSettings, siteOrigin } from "@/lib/settings";

type PageProps = {
  searchParams: Promise<{
    area?: string;
    category?: string;
    platform?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildShareMetadata({
    title: "Secondhand",
    description: `${settings.siteName} — barang bekas`,
    url: `${siteOrigin()}/secondhand`,
    siteName: settings.siteName,
  });
}

export default async function SecondhandPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const area = query.area?.trim() || null;
  const categorySlug = query.category?.trim() || null;
  const platform = query.platform?.trim() || null;

  const [categories, areas, platforms, products, flashSale] = await Promise.all([
    listCategories(),
    listStoreAreas(ProductKind.secondhand),
    listPlatforms(ProductKind.secondhand),
    listActiveSecondhand({
      storeArea: area,
      categorySlug,
      platform,
    }),
    getActiveFlashSalePublic(),
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
  }));

  return (
    <div className="section-secondhand">
      <Header active="secondhand" />
      <main className="container">
        <h1 className="page-title">Secondhand</h1>
        {flashSale ? (
          <FlashSaleStrip
            endsAt={flashSale.endsAt}
            startedAt={flashSale.startedAt}
            items={flashSale.items}
          />
        ) : null}
        <ProductBrowse
          mode="secondhand"
          label="Secondhand"
          items={items}
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeCategory={categorySlug}
          activeArea={area}
          activePlatform={platform}
          basePath="/secondhand"
          emptyText="Belum ada item"
        />
      </main>
    </div>
  );
}
