"use client";

import { useState } from "react";
import { buildShopeeAffiliateLink } from "@/lib/shopee";
import styles from "./AffiliateLinkTool.module.css";

type AffiliateLinkToolProps = {
  affiliateId: string | null | undefined;
  targetInputId?: string;
};

export function AffiliateLinkTool({
  affiliateId,
  targetInputId = "affiliateLink",
}: AffiliateLinkToolProps) {
  const [productUrl, setProductUrl] = useState("");
  const [subId, setSubId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onGenerate() {
    setError(null);
    setOk(false);
    if (!affiliateId) {
      setError("Isi Affiliate ID di Settings");
      return;
    }
    try {
      const link = buildShopeeAffiliateLink(
        productUrl,
        affiliateId,
        subId || undefined
      );
      const field = document.getElementById(
        targetInputId
      ) as HTMLInputElement | null;
      if (!field) {
        setError("Field tidak ada");
        return;
      }
      field.value = link;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
    }
  }

  return (
    <div className={styles.tool}>
      <div className="form-row">
        <label htmlFor="shopeeProductUrl">Link Shopee</label>
        <input
          id="shopeeProductUrl"
          type="url"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://shopee.co.id/..."
          disabled={!affiliateId}
        />
      </div>
      <div className="form-row">
        <label htmlFor="shopeeSubId">Sub ID</label>
        <input
          id="shopeeSubId"
          value={subId}
          onChange={(e) => setSubId(e.target.value)}
          disabled={!affiliateId}
        />
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={onGenerate}
        disabled={!affiliateId}
      >
        Generate
      </button>
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="success">OK</p> : null}
    </div>
  );
}
