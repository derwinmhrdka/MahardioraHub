import { notFound } from "next/navigation";
import { ProductKind } from "@prisma/client";
import { ProductBrowse } from "@/components/ProductBrowse";
import { SiteHeader } from "@/components/SiteHeader";
import { getCategoryBySlug, listCategories } from "@/lib/categories";
import {
  listDealsByCategory,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";

export const revalidate = 60;

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
      <SiteHeader active="deals" />
      <main className="container">
        <h1 className="page-title">{category.name}</h1>
        <ProductBrowse
          mode="deals"
          label={category.name}
          items={items}
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeCategory={category.slug}
          activeArea={area}
          activePlatform={platform}
          basePath={basePath}
          emptyText="Belum ada picks"
        />
      </main>
    </div>
  );
}
