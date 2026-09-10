import { Header } from "@/components/Header";
import { ProductBrowse } from "@/components/ProductBrowse";
import { listCategories } from "@/lib/categories";
import {
  listActiveDeals,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";
import { ProductKind } from "@prisma/client";
import type { Metadata } from "next";
import { buildShareMetadata } from "@/lib/seo";
import { getSettings, siteOrigin } from "@/lib/settings";

type PageProps = {
  searchParams: Promise<{ area?: string; platform?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildShareMetadata({
    title: "My Picks",
    description: `${settings.siteName} — My Picks`,
    url: `${siteOrigin()}/picks`,
    siteName: settings.siteName,
  });
}

export default async function PicksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const area = params.area?.trim() || null;
  const platform = params.platform?.trim() || null;

  const [categories, areas, platforms, products] = await Promise.all([
    listCategories(),
    listStoreAreas(ProductKind.deal),
    listPlatforms(ProductKind.deal),
    listActiveDeals({ storeArea: area, platform }),
  ]);

  const items = products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    shortNote: product.shortNote,
    imageUrl: product.imageUrl,
    categoryName: product.category.name,
    storeArea: product.storeArea,
    href: `/deals/product/${product.id}`,
  }));

  return (
    <div className="section-deals">
      <Header active="deals" />
      <main className="container">
        <h1 className="page-title">My Picks</h1>
        <ProductBrowse
          mode="deals"
          label="My Picks"
          items={items}
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeArea={area}
          activePlatform={platform}
          basePath="/picks"
          emptyText="Belum ada picks"
        />
      </main>
    </div>
  );
}
