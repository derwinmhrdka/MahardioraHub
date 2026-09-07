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
      setError("Set Shopee Affiliate ID in Settings first.");
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
        setError("Affiliate link field not found.");
        return;
      }
      field.value = link;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate link");
    }
  }

  return (
    <div className={styles.tool}>
      <div className={styles.title}>Optional: generate from product URL</div>
      <p className={styles.hint}>
        Paste a Shopee product link. Uses your Affiliate ID from Settings to
        build an <code>an_redir</code> tracked URL into the field below.
      </p>
      {!affiliateId ? (
        <p className="error">
          Shopee Affiliate ID is empty — set it in{" "}
          <a href="/admin/settings">Settings</a>.
        </p>
      ) : null}
      <div className="form-row">
        <label htmlFor="shopeeProductUrl">Shopee product URL</label>
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
        <label htmlFor="shopeeSubId">Sub ID (optional)</label>
        <input
          id="shopeeSubId"
          value={subId}
          onChange={(e) => setSubId(e.target.value)}
          placeholder="campaign-tag"
          disabled={!affiliateId}
        />
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onGenerate}
        disabled={!affiliateId}
      >
        Generate affiliate link
      </button>
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="success">Filled into Affiliate link.</p> : null}
    </div>
  );
}
