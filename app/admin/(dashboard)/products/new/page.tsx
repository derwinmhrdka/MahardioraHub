import { ProductKind } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AffiliateLinkTool } from "@/components/AffiliateLinkTool";
import { listCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    listCategories(),
  ]);

  return (
    <>
      <Link href="/admin/products" className="admin-back">
        <ArrowLeft size={15} strokeWidth={2} aria-hidden />
        Produk
      </Link>
      <h1 className="admin-title">Tambah produk</h1>
      <form action={createProductAction} className="form admin-form">
        <div className="form-row">
          <label htmlFor="kind">Jenis</label>
          <select id="kind" name="kind" defaultValue={ProductKind.deal} required>
            <option value={ProductKind.deal}>Deal</option>
            <option value={ProductKind.secondhand}>Secondhand</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="title">Judul</label>
          <input id="title" name="title" required />
        </div>
        <div className="form-row">
          <label htmlFor="categoryId">Kategori</label>
          <select id="categoryId" name="categoryId" required>
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
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="imageUrl">URL gambar</label>
          <input id="imageUrl" name="imageUrl" type="url" />
        </div>
        <div className="form-row">
          <label htmlFor="shortNote">Catatan singkat</label>
          <input id="shortNote" name="shortNote" maxLength={120} />
        </div>
        <div className="form-row">
          <label htmlFor="storeArea">Area toko</label>
          <input
            id="storeArea"
            name="storeArea"
            list="store-area-options"
            placeholder="Jakarta, Bandung, ..."
          />
        </div>
        <div className="form-row">
          <label htmlFor="shopName">Platform (deal saja)</label>
          <input id="shopName" name="shopName" placeholder="Shopee, Tokopedia, ..." />
        </div>
        <AffiliateLinkTool affiliateId={settings.shopeeAffiliateId} />
        <div className="form-row">
          <label htmlFor="affiliateLink">Affiliate link (deal saja)</label>
          <input id="affiliateLink" name="affiliateLink" type="url" />
        </div>
        <div className="form-row">
          <label className="admin-check">
            <input type="checkbox" name="isActive" defaultChecked />
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
