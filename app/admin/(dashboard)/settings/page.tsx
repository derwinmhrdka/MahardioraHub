import Link from "next/link";
import { Plus, Shield, ShieldOff, Trash2, UserRound } from "lucide-react";
import { FlashSaleAdmin } from "@/components/FlashSaleAdmin";
import { listCategories } from "@/lib/categories";
import {
  getFlashSaleAdmin,
  listSecondhandForFlashSale,
} from "@/lib/flash-sale";
import { productImages } from "@/lib/product-images";
import { getSettings } from "@/lib/settings";
import { listAdminAllowlist, listVisitorUsers } from "@/lib/users";
import {
  addAdminAction,
  createCategoryAction,
  deleteCategoryAction,
  makeAdminAction,
  revokeAdminAction,
  updateSettingsAction,
} from "./actions";
import styles from "./settings.module.css";

type Tab = "general" | "kontak" | "kategori" | "user" | "flash";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    catSaved?: string;
    catError?: string;
    userSaved?: string;
    userError?: string;
    flashSaved?: string;
    flashError?: string;
  }>;
};

function parseTab(raw: string | undefined): Tab {
  if (
    raw === "kontak" ||
    raw === "kategori" ||
    raw === "user" ||
    raw === "flash"
  ) {
    return raw;
  }
  return "general";
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const [settings, categories, admins, visitors, flashSale, flashProducts] =
    await Promise.all([
      getSettings(),
      listCategories(),
      tab === "user" ? listAdminAllowlist() : Promise.resolve([]),
      tab === "user" ? listVisitorUsers() : Promise.resolve([]),
      tab === "flash" ? getFlashSaleAdmin() : Promise.resolve(null),
      tab === "flash" ? listSecondhandForFlashSale() : Promise.resolve([]),
    ]);

  const showSaved =
    (params.saved && (tab === "general" || tab === "kontak")) ||
    (params.catSaved && tab === "kategori") ||
    (params.userSaved && tab === "user") ||
    (params.flashSaved && tab === "flash");
  const showError =
    (params.catError && tab === "kategori") ||
    (params.userError && tab === "user") ||
    (params.flashError && tab === "flash");

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
        <Link
          href="/admin/settings?tab=flash"
          role="tab"
          aria-selected={tab === "flash"}
          className={`${styles.tab} ${tab === "flash" ? styles.tabOn : ""}`}
        >
          Flash
        </Link>
        <Link
          href="/admin/settings?tab=user"
          role="tab"
          aria-selected={tab === "user"}
          className={`${styles.tab} ${tab === "user" ? styles.tabOn : ""}`}
        >
          User
        </Link>
      </div>

      {showSaved ? <p className="success">OK</p> : null}
      {showError ? <p className="error">Gagal</p> : null}

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

      {tab === "flash" && flashSale ? (
        <FlashSaleAdmin
          isActive={flashSale.isActive}
          durationMinutes={flashSale.durationMinutes}
          endsAt={flashSale.endsAt?.toISOString() ?? null}
          selectedIds={flashSale.items.map((item) => item.productId)}
          products={flashProducts.map((product) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            discountPercent: product.discountPercent,
            imageUrl: productImages(product)[0] ?? null,
            stock: product.stock,
          }))}
        />
      ) : null}

      {tab === "user" ? (
        <section aria-label="User" className={styles.userPanel}>
          <div className={styles.userBlock}>
            <h2 className={styles.userHead}>
              <Shield size={14} strokeWidth={2.25} aria-hidden />
              Admin
            </h2>

            <ul className={styles.userList}>
              {admins.length === 0 ? (
                <li className={styles.catEmpty}>—</li>
              ) : (
                admins.map((admin) => (
                  <li key={admin.email} className={styles.userRow}>
                    <span className={styles.userAvatar} aria-hidden>
                      {admin.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={admin.image}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserRound size={14} strokeWidth={2.25} />
                      )}
                    </span>
                    <span className={styles.userMeta}>
                      <span className={styles.userEmail}>{admin.email}</span>
                    </span>
                    <form action={revokeAdminAction}>
                      <input type="hidden" name="email" value={admin.email} />
                      <button
                        type="submit"
                        className={`${styles.iconBtn} ${styles.iconWarn}`}
                        aria-label="Revoke"
                        title="Revoke"
                      >
                        <ShieldOff size={14} strokeWidth={2.25} aria-hidden />
                      </button>
                    </form>
                  </li>
                ))
              )}
            </ul>

            <form action={addAdminAction} className={styles.addRow}>
              <input
                name="email"
                type="email"
                placeholder="email"
                aria-label="Email"
                required
              />
              <button
                type="submit"
                className={styles.iconBtn}
                aria-label="Admin"
                title="Admin"
              >
                <Shield size={16} strokeWidth={2.25} aria-hidden />
              </button>
            </form>
          </div>

          <div className={styles.userBlock}>
            <h2 className={styles.userHead}>
              <UserRound size={14} strokeWidth={2.25} aria-hidden />
              Visitor
            </h2>

            <ul className={styles.userList}>
              {visitors.length === 0 ? (
                <li className={styles.catEmpty}>—</li>
              ) : (
                visitors.map((visitor) => (
                  <li key={visitor.id} className={styles.userRow}>
                    <span className={styles.userAvatar} aria-hidden>
                      {visitor.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={visitor.image}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserRound size={14} strokeWidth={2.25} />
                      )}
                    </span>
                    <span className={styles.userMeta}>
                      <span className={styles.userEmail}>{visitor.email}</span>
                    </span>
                    <form action={makeAdminAction}>
                      <input type="hidden" name="email" value={visitor.email} />
                      <button
                        type="submit"
                        className={styles.iconBtn}
                        aria-label="Admin"
                        title="Admin"
                      >
                        <Shield size={14} strokeWidth={2.25} aria-hidden />
                      </button>
                    </form>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
