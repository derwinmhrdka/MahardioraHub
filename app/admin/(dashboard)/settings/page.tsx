import Link from "next/link";
import {
  CreditCard,
  Flame,
  Image as ImageIcon,
  MessageCircle,
  Plane,
  Plus,
  Settings2,
  Shield,
  ShieldOff,
  Tags,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { CollectionBannerAdmin } from "@/components/CollectionBannerAdmin";
import { FlashSaleAdmin } from "@/components/FlashSaleAdmin";
import { PreOrderAdmin } from "@/components/PreOrderAdmin";
import { listCategories } from "@/lib/categories";
import { listBannerItems } from "@/lib/collection-banner";
import {
  getFlashSaleAdmin,
  listSecondhandForFlashSale,
} from "@/lib/flash-sale";
import {
  dateToYmd,
  jakartaTodayYmd,
  listPreOrdersAdmin,
  listSecondhandForPreOrder,
} from "@/lib/pre-order";
import { midtransConfigured } from "@/lib/midtrans";
import { productImages } from "@/lib/product-images";
import { getSettings } from "@/lib/settings";
import { listAdminAllowlist, listVisitorUsers } from "@/lib/users";
import { xenditConfigured } from "@/lib/xendit";
import {
  addAdminAction,
  createBankAccountAction,
  createCategoryAction,
  deleteBankAccountAction,
  deleteCategoryAction,
  makeAdminAction,
  revokeAdminAction,
  toggleBankAccountAction,
  updateSettingsAction,
} from "./actions";
import { listBankAccounts } from "@/lib/bank-accounts";
import styles from "./settings.module.css";

type Tab =
  | "general"
  | "kontak"
  | "kategori"
  | "user"
  | "flash"
  | "preorder"
  | "payment"
  | "banner";

type NavItem = {
  id: Tab;
  label: string;
  hint: string;
  Icon: typeof Settings2;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "umum",
    label: "General",
    items: [
      {
        id: "general",
        label: "Site",
        hint: "Nama toko & affiliate",
        Icon: Settings2,
      },
      {
        id: "kontak",
        label: "Kontak",
        hint: "WhatsApp & email",
        Icon: MessageCircle,
      },
    ],
  },
  {
    id: "katalog",
    label: "Katalog",
    items: [
      {
        id: "kategori",
        label: "Kategori",
        hint: "Kategori produk",
        Icon: Tags,
      },
      {
        id: "banner",
        label: "Banner",
        hint: "Banner collection",
        Icon: ImageIcon,
      },
      {
        id: "flash",
        label: "Flash Sale",
        hint: "Promo waktu terbatas",
        Icon: Flame,
      },
      {
        id: "preorder",
        label: "Pre Order",
        hint: "Last order per tanggal",
        Icon: Plane,
      },
    ],
  },
  {
    id: "bayar",
    label: "Pembayaran",
    items: [
      {
        id: "payment",
        label: "Metode",
        hint: "QRIS & transfer bank",
        Icon: CreditCard,
      },
    ],
  },
  {
    id: "akun",
    label: "User Management",
    items: [
      {
        id: "user",
        label: "Pengguna",
        hint: "Admin & visitor",
        Icon: Users,
      },
    ],
  },
];

const ALL_TABS = NAV_GROUPS.flatMap((group) => group.items);

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
    preSaved?: string;
    preError?: string;
    bannerSaved?: string;
    bannerError?: string;
    bankSaved?: string;
    bankError?: string;
  }>;
};

function parseTab(raw: string | undefined): Tab {
  if (ALL_TABS.some((item) => item.id === raw)) {
    return raw as Tab;
  }
  return "general";
}

function findActive(tab: Tab) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.id === tab);
    if (item) return { group, item };
  }
  return { group: NAV_GROUPS[0], item: NAV_GROUPS[0].items[0] };
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const active = findActive(tab);

  const [
    settings,
    categories,
    admins,
    visitors,
    flashSale,
    flashProducts,
    preOrders,
    preProducts,
    bankAccounts,
  ] = await Promise.all([
    getSettings(),
    listCategories(),
    tab === "user" ? listAdminAllowlist() : Promise.resolve([]),
    tab === "user" ? listVisitorUsers() : Promise.resolve([]),
    tab === "flash" ? getFlashSaleAdmin() : Promise.resolve(null),
    tab === "flash" ? listSecondhandForFlashSale() : Promise.resolve([]),
    tab === "preorder" ? listPreOrdersAdmin() : Promise.resolve([]),
    tab === "preorder" ? listSecondhandForPreOrder() : Promise.resolve([]),
    tab === "payment" ? listBankAccounts() : Promise.resolve([]),
  ]);

  const todayYmd = jakartaTodayYmd();

  const showSaved =
    (params.saved &&
      (tab === "general" || tab === "kontak" || tab === "payment")) ||
    (params.catSaved && tab === "kategori") ||
    (params.userSaved && tab === "user") ||
    (params.flashSaved && tab === "flash") ||
    (params.preSaved && tab === "preorder") ||
    (params.bannerSaved && tab === "banner") ||
    (params.bankSaved && tab === "payment");
  const showError =
    (params.catError && tab === "kategori") ||
    (params.userError && tab === "user") ||
    (params.flashError && tab === "flash") ||
    (params.preError && tab === "preorder") ||
    (params.bannerError && tab === "banner") ||
    (params.bankError && tab === "payment");

  const midtransOk = midtransConfigured();
  const xenditOk = xenditConfigured();
  const ActiveIcon = active.item.Icon;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.eyebrow}>Admin</p>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Kelola toko, katalog, pembayaran, dan pengguna
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Menu settings">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className={styles.navGroup}>
              <p className={styles.navGroupLabel}>{group.label}</p>
              <nav className={styles.navList} aria-label={group.label}>
                {group.items.map(({ id, label, hint, Icon }) => {
                  const on = tab === id;
                  return (
                    <Link
                      key={id}
                      href={`/admin/settings?tab=${id}`}
                      className={`${styles.navItem} ${on ? styles.navItemOn : ""}`}
                      aria-current={on ? "page" : undefined}
                    >
                      <span className={styles.navIcon} aria-hidden>
                        <Icon size={15} strokeWidth={2.35} />
                      </span>
                      <span className={styles.navCopy}>
                        <span className={styles.navLabel}>{label}</span>
                        <span className={styles.navHint}>{hint}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </aside>

        <section className={styles.content} aria-labelledby="settings-section">
          <div className={styles.contentHead}>
            <div className={styles.contentMark} aria-hidden>
              <ActiveIcon size={18} strokeWidth={2.25} />
            </div>
            <div className={styles.contentTitles}>
              <p className={styles.contentGroup}>{active.group.label}</p>
              <h2 id="settings-section" className={styles.contentTitle}>
                {active.item.label}
              </h2>
              <p className={styles.contentHint}>{active.item.hint}</p>
            </div>
          </div>

          <div className={styles.panel}>
            {showSaved ? (
              <p className={styles.noticeOk} role="status">
                Tersimpan
              </p>
            ) : null}
            {showError ? (
              <p className={styles.noticeErr} role="alert">
                Gagal menyimpan
              </p>
            ) : null}

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

            {tab === "payment" ? (
              <div className={styles.payStack}>
                <form action={updateSettingsAction} className="form admin-form">
                  <input type="hidden" name="section" value="payment" />
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionCardHead}>
                      <p className={styles.payLabel}>QRIS</p>
                      <p className={styles.sectionCardHint}>
                        Pilih provider pembayaran QR
                      </p>
                    </div>
                    <div
                      className={styles.payList}
                      role="radiogroup"
                      aria-label="QRIS"
                    >
                      <label className={styles.payOption}>
                        <input
                          type="radio"
                          name="qrisProvider"
                          value="midtrans"
                          defaultChecked={settings.qrisProvider === "midtrans"}
                        />
                        <span className={styles.payName}>Midtrans</span>
                        <span
                          className={`${styles.payBadge} ${
                            midtransOk ? styles.payBadgeOk : ""
                          }`}
                        >
                          {midtransOk ? "Ready" : "Belum set"}
                        </span>
                      </label>
                      <label className={styles.payOption}>
                        <input
                          type="radio"
                          name="qrisProvider"
                          value="xendit"
                          defaultChecked={settings.qrisProvider === "xendit"}
                        />
                        <span className={styles.payName}>Xendit</span>
                        <span
                          className={`${styles.payBadge} ${
                            xenditOk ? styles.payBadgeOk : ""
                          }`}
                        >
                          {xenditOk ? "Ready" : "Belum set"}
                        </span>
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-block">
                        Simpan QRIS
                      </button>
                    </div>
                  </div>
                </form>

                <section
                  className={styles.sectionCard}
                  aria-label="Transfer bank"
                >
                  <div className={styles.sectionCardHead}>
                    <p className={styles.payLabel}>Transfer bank</p>
                    <p className={styles.sectionCardHint}>
                      Rekening untuk pembayaran manual
                    </p>
                  </div>
                  <ul className={styles.bankList}>
                    {bankAccounts.length === 0 ? (
                      <li className={styles.catEmpty}>Belum ada rekening</li>
                    ) : (
                      bankAccounts.map((account) => (
                        <li key={account.id} className={styles.bankRow}>
                          <div className={styles.bankMeta}>
                            <span className={styles.bankName}>
                              {account.bankName}
                              {!account.isActive ? (
                                <span className={styles.bankOff}> off</span>
                              ) : null}
                            </span>
                            <span className={styles.bankDetail}>
                              {account.accountName} · {account.accountNumber}
                            </span>
                          </div>
                          <div className={styles.bankActions}>
                            <form action={toggleBankAccountAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={account.id}
                              />
                              <input
                                type="hidden"
                                name="isActive"
                                value={account.isActive ? "0" : "1"}
                              />
                              <button
                                type="submit"
                                className={styles.iconBtn}
                                aria-label={
                                  account.isActive ? "Nonaktifkan" : "Aktifkan"
                                }
                                title={
                                  account.isActive ? "Nonaktifkan" : "Aktifkan"
                                }
                              >
                                {account.isActive ? (
                                  <ShieldOff size={14} strokeWidth={2.25} />
                                ) : (
                                  <Shield size={14} strokeWidth={2.25} />
                                )}
                              </button>
                            </form>
                            <form action={deleteBankAccountAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={account.id}
                              />
                              <button
                                type="submit"
                                className={styles.iconBtn}
                                aria-label="Hapus"
                                title="Hapus"
                              >
                                <Trash2
                                  size={14}
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                              </button>
                            </form>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>

                  <form
                    action={createBankAccountAction}
                    className={styles.bankAdd}
                  >
                    <input
                      name="bankName"
                      placeholder="Bank"
                      aria-label="Nama bank"
                      required
                    />
                    <input
                      name="accountName"
                      placeholder="Atas nama"
                      aria-label="Atas nama"
                      required
                    />
                    <input
                      name="accountNumber"
                      placeholder="No. rekening"
                      aria-label="Nomor rekening"
                      inputMode="numeric"
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
              </div>
            ) : null}

            {tab === "kategori" ? (
              <section aria-label="Kategori">
                <ul className={styles.catList}>
                  {categories.length === 0 ? (
                    <li className={styles.catEmpty}>Belum ada kategori</li>
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
                    placeholder="Nama kategori"
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

            {tab === "preorder" ? (
              <PreOrderAdmin
                todayYmd={todayYmd}
                batches={preOrders.map((batch) => {
                  const ymd = dateToYmd(batch.lastOrderDate);
                  const status =
                    ymd < todayYmd
                      ? "expired"
                      : ymd === todayYmd
                        ? "today"
                        : "upcoming";
                  return {
                    id: batch.id,
                    lastOrderDate: ymd,
                    productIds: batch.items.map((item) => item.productId),
                    status,
                  };
                })}
                products={preProducts.map((product) => ({
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  discountPercent: product.discountPercent,
                  imageUrl: productImages(product)[0] ?? null,
                  stock: product.stock,
                }))}
              />
            ) : null}

            {tab === "banner" ? (
              <CollectionBannerAdmin
                items={listBannerItems(
                  settings.collectionBannerImages ?? [],
                  settings.collectionBannerHidden ?? []
                )}
              />
            ) : null}

            {tab === "user" ? (
              <section aria-label="User" className={styles.userStack}>
                <div className={styles.userBlock}>
                  <h3 className={styles.userHead}>
                    <Shield size={14} strokeWidth={2.25} aria-hidden />
                    Admin
                  </h3>

                  <ul className={styles.userList}>
                    {admins.length === 0 ? (
                      <li className={styles.catEmpty}>Belum ada admin</li>
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
                            <span className={styles.userEmail}>
                              {admin.email}
                            </span>
                          </span>
                          <form action={revokeAdminAction}>
                            <input
                              type="hidden"
                              name="email"
                              value={admin.email}
                            />
                            <button
                              type="submit"
                              className={`${styles.iconBtn} ${styles.iconWarn}`}
                              aria-label="Revoke"
                              title="Revoke"
                            >
                              <ShieldOff
                                size={14}
                                strokeWidth={2.25}
                                aria-hidden
                              />
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
                      placeholder="email admin baru"
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
                  <h3 className={styles.userHead}>
                    <UserRound size={14} strokeWidth={2.25} aria-hidden />
                    Visitor
                  </h3>

                  <ul className={styles.userList}>
                    {visitors.length === 0 ? (
                      <li className={styles.catEmpty}>Belum ada visitor</li>
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
                            <span className={styles.userEmail}>
                              {visitor.email}
                            </span>
                          </span>
                          <form action={makeAdminAction}>
                            <input
                              type="hidden"
                              name="email"
                              value={visitor.email}
                            />
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
          </div>
        </section>
      </div>
    </div>
  );
}
