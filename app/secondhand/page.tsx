import { ProductKind } from "@prisma/client";
import { Header } from "@/components/Header";
import { ProductBrowse } from "@/components/ProductBrowse";
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
