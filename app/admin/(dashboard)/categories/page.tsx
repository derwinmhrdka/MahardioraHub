import { AdminNav } from "@/components/AdminNav";
import { listCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { createCategoryAction, renameCategoryAction } from "./actions";

export default async function AdminCategoriesPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    listCategories(),
  ]);

  return (
    <>
      <AdminNav siteName={settings.siteName} active="categories" />
      <h1 className="page-title">Categories</h1>

      <form action={createCategoryAction} className="form" style={{ marginBottom: "1.5rem" }}>
        <div className="form-row">
          <label htmlFor="name">New category</label>
          <input id="name" name="name" required />
        </div>
        <button type="submit" className="btn">
          Add
        </button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Rename</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td className="muted">{category.slug}</td>
                <td>
                  <form
                    action={renameCategoryAction}
                    style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                  >
                    <input type="hidden" name="id" value={category.id} />
                    <input
                      name="name"
                      defaultValue={category.name}
                      required
                      style={{
                        padding: "0.35rem 0.5rem",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        minWidth: "8rem",
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem" }}
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
