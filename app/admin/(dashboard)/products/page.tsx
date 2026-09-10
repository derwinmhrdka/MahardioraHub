import { AdminProductList } from "@/components/AdminProductList";
import { listAllProducts } from "@/lib/products";
import {
  deleteProductAction,
  hideProductAction,
  showProductAction,
} from "./actions";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    imported?: string;
    failed?: string;
    importError?: string;
  }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const products = await listAllProducts();
  const activeTab =
    params.tab === "deal" ? "deal" : "secondhand";

  const items = products.map((product) => ({
    id: product.id,
    title: product.title,
    kind: product.kind,
    price: product.price,
    discountPercent: product.discountPercent,
    isActive: product.isActive,
    storeArea: product.storeArea,
    categoryName: product.category.name,
    imageUrl: product.imageUrl,
  }));

  let notice: string | null = null;
  let noticeTone: "ok" | "error" = "ok";
  if (params.importError) {
    notice = `Import gagal: ${params.importError}`;
    noticeTone = "error";
  } else if (params.imported) {
    const imported = params.imported;
    const failed = params.failed;
    notice = failed
      ? `Import ${imported} produk. ${failed} baris gagal.`
      : `Import ${imported} produk.`;
    noticeTone = failed ? "error" : "ok";
  }

  return (
    <AdminProductList
      products={items}
      activeTab={activeTab}
      hideAction={hideProductAction}
      showAction={showProductAction}
      deleteAction={deleteProductAction}
      notice={notice}
      noticeTone={noticeTone}
    />
  );
}
