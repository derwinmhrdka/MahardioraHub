import { listCategories } from "@/lib/categories";
import { createCategoryAction, renameCategoryAction } from "./actions";
import styles from "./categories.module.css";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <>
      <h1 className={styles.title}>Kategori</h1>

      <form action={createCategoryAction} className={`form ${styles.create}`}>
        <div className="form-row">
          <label htmlFor="name">Kategori baru</label>
          <input
            id="name"
            name="name"
            required
            placeholder="contoh: Electronics"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn-block">
          Tambah
        </button>
      </form>

      <ul className={styles.list}>
        {categories.map((category) => (
          <li key={category.id} className={styles.card}>
            <div className={styles.head}>
              <p className={styles.name}>{category.name}</p>
              <p className={styles.slug}>{category.slug}</p>
            </div>
            <form action={renameCategoryAction} className={styles.rename}>
              <input type="hidden" name="id" value={category.id} />
              <input
                name="name"
                defaultValue={category.name}
                required
                aria-label={`Ubah nama ${category.name}`}
              />
              <button type="submit" className="btn btn-secondary">
                Simpan
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
