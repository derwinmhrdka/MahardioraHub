import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { ProductKind } from "@prisma/client";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { getCategoryBySlug, listCategories } from "@/lib/categories";
import {
  listDealsByCategory,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ area?: string; platform?: string }>;
};

export default async function CategoryDealsPage({
  params,
  searchParams,
}: PageProps) {
  const { categorySlug } = await params;
  const query = await searchParams;
  const area = query.area?.trim() || null;
  const platform = query.platform?.trim() || null;

  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const basePath = `/deals/${category.slug}`;

  const [categories, areas, platforms, products] = await Promise.all([
    listCategories(),
    listStoreAreas(ProductKind.deal),
    listPlatforms(ProductKind.deal),
    listDealsByCategory(categorySlug, { storeArea: area, platform }),
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
        <h1 className="page-title">{category.name}</h1>
        <CategoryFilterBar
          mode="deals"
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeCategory={category.slug}
          activeArea={area}
          activePlatform={platform}
          basePath={basePath}
        />
        {products.length === 0 ? (
          <div className="empty">
            <Package size={36} strokeWidth={1.5} aria-hidden />
            <p>No deals here</p>
          </div>
        ) : (
          <ProductCatalog label={category.name} items={items} />
        )}
      </main>
    </div>
  );
}
