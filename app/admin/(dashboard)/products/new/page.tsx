import { ProductKind } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
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
      <AdminNav siteName={settings.siteName} active="products" />
      <h1 className="page-title">New product</h1>
      <form action={createProductAction} className="form">
        <div className="form-row">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind" defaultValue={ProductKind.deal} required>
            <option value={ProductKind.deal}>Deal</option>
            <option value={ProductKind.secondhand}>Secondhand</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" required />
        </div>
        <div className="form-row">
          <label htmlFor="categoryId">Category</label>
          <select id="categoryId" name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="price">Price (Rp, whole number)</label>
          <input id="price" name="price" type="number" min="0" step="1" required />
        </div>
        <div className="form-row">
          <label htmlFor="imageUrl">Image URL</label>
          <input id="imageUrl" name="imageUrl" type="url" />
        </div>
        <div className="form-row">
          <label htmlFor="shortNote">Short note</label>
          <input id="shortNote" name="shortNote" maxLength={120} />
        </div>
        <div className="form-row">
          <label htmlFor="storeArea">Store area</label>
          <input
            id="storeArea"
            name="storeArea"
            list="store-area-options"
            placeholder="Jakarta, Bandung, ..."
          />
        </div>
        <div className="form-row">
          <label htmlFor="shopName">Platform (deals only)</label>
          <input id="shopName" name="shopName" placeholder="Shopee, Tokopedia, ..." />
        </div>
        <AffiliateLinkTool affiliateId={settings.shopeeAffiliateId} />
        <div className="form-row">
          <label htmlFor="affiliateLink">Affiliate link (deals only)</label>
          <input id="affiliateLink" name="affiliateLink" type="url" />
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" name="isActive" defaultChecked /> Active
          </label>
        </div>
        <button type="submit" className="btn">
          Create
        </button>
      </form>
    </>
  );
}
