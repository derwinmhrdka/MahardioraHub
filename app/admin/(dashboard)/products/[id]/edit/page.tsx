import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/ProductForm";
import { listCategories } from "@/lib/categories";
import { getProduct } from "@/lib/products";
import { updateProductAction } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [categories, product] = await Promise.all([
    listCategories(),
    getProduct(productId),
  ]);

  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="admin-back">
        <ArrowLeft size={12} strokeWidth={2} aria-hidden />
        Produk
      </Link>
      <h1 className="admin-title">Edit produk</h1>
      <ProductForm
        action={updateProductAction}
        categories={categories}
        productId={product.id}
        defaults={{
          kind: product.kind,
          title: product.title,
          categoryId: product.categoryId,
          price: product.price,
          imageUrl: product.imageUrl,
          shortNote: product.shortNote,
          storeArea: product.storeArea,
          shopName: product.shopName,
          affiliateLink: product.affiliateLink,
          isActive: product.isActive,
        }}
      />
    </>
  );
}
