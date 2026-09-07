import { AdminNav } from "@/components/AdminNav";
import { getSettings } from "@/lib/settings";
import { updateSettingsAction } from "./actions";

type PageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <>
      <AdminNav siteName={settings.siteName} active="settings" />
      <h1 className="page-title">Settings</h1>
      {params.saved ? <p className="success">Saved.</p> : null}
      <form action={updateSettingsAction} className="form">
        <div className="form-row">
          <label htmlFor="siteName">Site name</label>
          <input
            id="siteName"
            name="siteName"
            defaultValue={settings.siteName}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="whatsappNumber">
            WhatsApp number (international, digits only)
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            required
            inputMode="numeric"
          />
        </div>
        <div className="form-row">
          <label htmlFor="contactEmail">Contact email</label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={settings.contactEmail ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="shopeeAffiliateId">Shopee Affiliate ID</label>
          <input
            id="shopeeAffiliateId"
            name="shopeeAffiliateId"
            defaultValue={settings.shopeeAffiliateId ?? ""}
            inputMode="numeric"
            placeholder="From Shopee Affiliate dashboard"
          />
        </div>
        <button type="submit" className="btn">
          Save settings
        </button>
      </form>
    </>
  );
}
