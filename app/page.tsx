import { Package } from "lucide-react";
import { ProductKind } from "@prisma/client";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { listCategories } from "@/lib/categories";
import {
  listActiveDeals,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";

type PageProps = {
  searchParams: Promise<{ area?: string; platform?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
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
        <h1 className="page-title">Deals</h1>
        <CategoryFilterBar
          mode="deals"
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeArea={area}
          activePlatform={platform}
          basePath="/"
        />
        {products.length === 0 ? (
          <div className="empty">
            <Package size={36} strokeWidth={1.5} aria-hidden />
            <p>No deals yet</p>
          </div>
        ) : (
          <ProductCatalog label="Deals" items={items} />
        )}
      </main>
    </div>
  );
}
