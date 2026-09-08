import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { listCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateSettingsAction,
} from "./actions";
import styles from "./settings.module.css";

type Tab = "general" | "kontak" | "kategori";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    catSaved?: string;
    catError?: string;
  }>;
};

function parseTab(raw: string | undefined): Tab {
  if (raw === "kontak" || raw === "kategori") return raw;
  return "general";
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const [settings, categories] = await Promise.all([
    getSettings(),
    listCategories(),
  ]);

  const showSaved =
    (params.saved && (tab === "general" || tab === "kontak")) ||
    (params.catSaved && tab === "kategori");
  const showCatError = params.catError && tab === "kategori";

  return (
    <>
      <h1 className="admin-title">Settings</h1>

      <div className={styles.tabs} role="tablist" aria-label="Settings">
        <Link
          href="/admin/settings?tab=general"
          role="tab"
          aria-selected={tab === "general"}
          className={`${styles.tab} ${tab === "general" ? styles.tabOn : ""}`}
        >
          General
        </Link>
        <Link
          href="/admin/settings?tab=kontak"
          role="tab"
          aria-selected={tab === "kontak"}
          className={`${styles.tab} ${tab === "kontak" ? styles.tabOn : ""}`}
        >
          Kontak
        </Link>
        <Link
          href="/admin/settings?tab=kategori"
          role="tab"
          aria-selected={tab === "kategori"}
          className={`${styles.tab} ${tab === "kategori" ? styles.tabOn : ""}`}
        >
          Kategori
        </Link>
      </div>

      {showSaved ? <p className="success">OK</p> : null}
      {showCatError ? <p className="error">Gagal</p> : null}

      {tab === "general" ? (
        <form action={updateSettingsAction} className="form admin-form">
          <input type="hidden" name="section" value="general" />
          <div className="form-row">
            <label htmlFor="siteName">Site</label>
            <input
              id="siteName"
              name="siteName"
              defaultValue={settings.siteName}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="shopeeAffiliateId">Affiliate ID</label>
            <input
              id="shopeeAffiliateId"
              name="shopeeAffiliateId"
              defaultValue={settings.shopeeAffiliateId ?? ""}
              inputMode="numeric"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-block">
              Simpan
            </button>
          </div>
        </form>
      ) : null}

      {tab === "kontak" ? (
        <form action={updateSettingsAction} className="form admin-form">
          <input type="hidden" name="section" value="kontak" />
          <div className="form-row">
            <label htmlFor="whatsappNumber">WhatsApp</label>
            <input
              id="whatsappNumber"
              name="whatsappNumber"
              defaultValue={settings.whatsappNumber}
              required
              inputMode="numeric"
            />
          </div>
          <div className="form-row">
            <label htmlFor="whatsappTemplate">Chat</label>
            <textarea
              id="whatsappTemplate"
              name="whatsappTemplate"
              rows={3}
              maxLength={1000}
              defaultValue={settings.whatsappTemplate}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="contactEmail">Email</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail ?? ""}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-block">
              Simpan
            </button>
          </div>
        </form>
      ) : null}

      {tab === "kategori" ? (
        <section aria-label="Kategori">
          <ul className={styles.catList}>
            {categories.length === 0 ? (
              <li className={styles.catEmpty}>—</li>
            ) : (
              categories.map((category) => (
                <li key={category.id} className={styles.catRow}>
                  <span className={styles.catName}>{category.name}</span>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      className={styles.iconBtn}
                      aria-label="Hapus"
                      title="Hapus"
                    >
                      <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                    </button>
                  </form>
                </li>
              ))
            )}
          </ul>

          <form action={createCategoryAction} className={styles.addRow}>
            <input
              name="name"
              placeholder="Nama"
              aria-label="Kategori"
              required
            />
            <button
              type="submit"
              className={styles.iconBtn}
              aria-label="Tambah"
              title="Tambah"
            >
              <Plus size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
