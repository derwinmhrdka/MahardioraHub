import { notFound } from "next/navigation";
import { ProductKind } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
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
      <AdminNav siteName={settings.siteName} active="products" />
      <h1 className="page-title">Edit product</h1>
      <form action={updateProductAction} className="form">
        <input type="hidden" name="id" value={product.id} />
        <div className="form-row">
          <label htmlFor="kind">Kind</label>
          <select id="kind" name="kind" defaultValue={product.kind} required>
            <option value={ProductKind.deal}>Deal</option>
            <option value={ProductKind.secondhand}>Secondhand</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={product.title} required />
        </div>
        <div className="form-row">
          <label htmlFor="categoryId">Category</label>
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
          <label htmlFor="price">Price (Rp, whole number)</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={product.price}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product.imageUrl ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="shortNote">Short note</label>
          <input
            id="shortNote"
            name="shortNote"
            maxLength={120}
            defaultValue={product.shortNote ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="storeArea">Store area</label>
          <input
            id="storeArea"
            name="storeArea"
            placeholder="Jakarta, Bandung, ..."
            defaultValue={product.storeArea ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="shopName">Platform (deals only)</label>
          <input
            id="shopName"
            name="shopName"
            placeholder="Shopee, Tokopedia, ..."
            defaultValue={product.shopName ?? ""}
          />
        </div>
        <AffiliateLinkTool affiliateId={settings.shopeeAffiliateId} />
        <div className="form-row">
          <label htmlFor="affiliateLink">Affiliate link (deals only)</label>
          <input
            id="affiliateLink"
            name="affiliateLink"
            type="url"
            defaultValue={product.affiliateLink ?? ""}
          />
        </div>
        <div className="form-row">
          <label>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product.isActive}
            />{" "}
            Active
          </label>
        </div>
        <button type="submit" className="btn">
          Save
        </button>
      </form>
    </>
  );
}
