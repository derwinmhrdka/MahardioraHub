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
      setError("Isi Shopee Affiliate ID di Settings dulu.");
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
        setError("Field affiliate link tidak ditemukan.");
        return;
      }
      field.value = link;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat link");
    }
  }

  return (
    <div className={styles.tool}>
      <div className={styles.title}>Opsional: generate dari URL produk</div>
      <p className={styles.hint}>
        Tempel link produk Shopee. Pakai Affiliate ID dari Settings untuk
        membuat URL <code>an_redir</code> ke field di bawah.
      </p>
      {!affiliateId ? (
        <p className="error">
          Shopee Affiliate ID masih kosong — isi di{" "}
          <a href="/admin/settings">Settings</a>.
        </p>
      ) : null}
      <div className="form-row">
        <label htmlFor="shopeeProductUrl">URL produk Shopee</label>
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
        <label htmlFor="shopeeSubId">Sub ID (opsional)</label>
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
        className="btn btn-secondary btn-block"
        onClick={onGenerate}
        disabled={!affiliateId}
      >
        Generate affiliate link
      </button>
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="success">Sudah diisi ke Affiliate link.</p> : null}
    </div>
  );
}
