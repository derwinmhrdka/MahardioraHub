import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductKind } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { AffiliateLinkTool } from "@/components/AffiliateLinkTool";
import { listCategories } from "@/lib/categories";
import { getProduct } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { updateProductAction } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [settings, categories, product] = await Promise.all([
    getSettings(),
    listCategories(),
    getProduct(productId),
  ]);

  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="admin-back">
        <ArrowLeft size={15} strokeWidth={2} aria-hidden />
        Produk
      </Link>
      <h1 className="admin-title">Edit produk</h1>
      <form action={updateProductAction} className="form admin-form">
        <input type="hidden" name="id" value={product.id} />
        <div className="form-row">
          <label htmlFor="kind">Jenis</label>
          <select id="kind" name="kind" defaultValue={product.kind} required>
            <option value={ProductKind.deal}>Deal</option>
            <option value={ProductKind.secondhand}>Secondhand</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="title">Judul</label>
          <input id="title" name="title" defaultValue={product.title} required />
        </div>
        <div className="form-row">
          <label htmlFor="categoryId">Kategori</label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="price">Harga (Rp, bilangan bulat)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            defaultValue={product.price}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="imageUrl">URL gambar</label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product.imageUrl ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="shortNote">Catatan singkat</label>
          <input
            id="shortNote"
            name="shortNote"
            maxLength={120}
            defaultValue={product.shortNote ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="storeArea">Area toko</label>
          <input
            id="storeArea"
            name="storeArea"
            placeholder="Jakarta, Bandung, ..."
            defaultValue={product.storeArea ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="shopName">Platform (deal saja)</label>
          <input
            id="shopName"
            name="shopName"
            placeholder="Shopee, Tokopedia, ..."
            defaultValue={product.shopName ?? ""}
          />
        </div>
        <AffiliateLinkTool affiliateId={settings.shopeeAffiliateId} />
        <div className="form-row">
          <label htmlFor="affiliateLink">Affiliate link (deal saja)</label>
          <input
            id="affiliateLink"
            name="affiliateLink"
            type="url"
            defaultValue={product.affiliateLink ?? ""}
          />
        </div>
        <div className="form-row">
          <label className="admin-check">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product.isActive}
            />
            Tampilkan di Site
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-block">
            Simpan
          </button>
        </div>
      </form>
    </>
  );
}
