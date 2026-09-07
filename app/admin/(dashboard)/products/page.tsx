import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { ToggleActiveButton } from "@/components/ToggleActiveButton";
import { formatRupiah } from "@/lib/format";
import { listAllProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import {
  activateProductAction,
  deactivateProductAction,
} from "./actions";

export default async function AdminProductsPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    listAllProducts(),
  ]);

  return (
    <>
      <AdminNav siteName={settings.siteName} active="products" />
      <div className="admin-actions">
        <Link href="/admin/products/new" className="btn">
          <Plus size={16} strokeWidth={2} aria-hidden />
          Add
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Kind</th>
              <th>Category</th>
              <th>Area</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>
                  <span
                    className={`badge ${
                      product.kind === "deal" ? "badge-deal" : "badge-secondhand"
                    }`}
                  >
                    {product.kind}
                  </span>
                </td>
                <td>{product.category.name}</td>
                <td>{product.storeArea ?? "—"}</td>
                <td className="num">{formatRupiah(product.price)}</td>
                <td>
                  {product.isActive ? (
                    <span className="badge badge-secondhand">active</span>
                  ) : (
                    <span className="badge badge-inactive">off</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="btn-icon"
                      title="Edit"
                      aria-label={`Edit ${product.title}`}
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </Link>
                    <ToggleActiveButton
                      productId={product.id}
                      isActive={product.isActive}
                      activateAction={activateProductAction}
                      deactivateAction={deactivateProductAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
