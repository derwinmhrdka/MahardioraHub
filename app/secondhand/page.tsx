import { Recycle } from "lucide-react";
import { ProductKind } from "@prisma/client";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { listCategories } from "@/lib/categories";
import {
  listActiveSecondhand,
  listPlatforms,
  listStoreAreas,
} from "@/lib/products";

type PageProps = {
  searchParams: Promise<{
    area?: string;
    category?: string;
    platform?: string;
  }>;
};

export default async function SecondhandPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const area = query.area?.trim() || null;
  const categorySlug = query.category?.trim() || null;
  const platform = query.platform?.trim() || null;

  const [categories, areas, platforms, products] = await Promise.all([
    listCategories(),
    listStoreAreas(ProductKind.secondhand),
    listPlatforms(ProductKind.secondhand),
    listActiveSecondhand({
      storeArea: area,
      categorySlug,
      platform,
    }),
  ]);

  const items = products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
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
        <CategoryFilterBar
          mode="secondhand"
          categories={categories}
          areas={areas}
          platforms={platforms}
          activeCategory={categorySlug}
          activeArea={area}
          activePlatform={platform}
          basePath="/secondhand"
        />
        {products.length === 0 ? (
          <div className="empty">
            <Recycle size={36} strokeWidth={1.5} aria-hidden />
            <p>Belum ada item</p>
          </div>
        ) : (
          <ProductCatalog label="Secondhand" items={items} />
        )}
      </main>
    </div>
  );
}
