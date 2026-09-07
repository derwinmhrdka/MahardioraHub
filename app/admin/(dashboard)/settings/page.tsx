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
      <h1 className="admin-title">Settings</h1>
      {params.saved ? <p className="success">OK</p> : null}
      <form action={updateSettingsAction} className="form admin-form">
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
          <label htmlFor="contactEmail">Email</label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={settings.contactEmail ?? ""}
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
    </>
  );
}
