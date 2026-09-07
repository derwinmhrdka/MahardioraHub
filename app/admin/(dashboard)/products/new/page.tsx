import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/ProductForm";
import { listCategories } from "@/lib/categories";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <>
      <Link href="/admin/products" className="admin-back">
        <ArrowLeft size={12} strokeWidth={2} aria-hidden />
        Produk
      </Link>
      <h1 className="admin-title">Tambah produk</h1>
      <ProductForm action={createProductAction} categories={categories} />
    </>
  );
}
