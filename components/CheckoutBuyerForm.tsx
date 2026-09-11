"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Phone, UserRound } from "lucide-react";
import { PaymentMethods } from "@/components/PaymentMethods";
import styles from "./CheckoutBuyerForm.module.css";

type BuyerDraft = {
  name: string;
  whatsapp: string;
  address: string;
};

type CheckoutBuyerFormProps = {
  qrisEnabled: boolean;
  bankTransferEnabled: boolean;
  initialBuyer: BuyerDraft;
  whatsappOnly?: boolean;
};

export function CheckoutBuyerForm({
  qrisEnabled,
  bankTransferEnabled,
  initialBuyer,
  whatsappOnly = false,
}: CheckoutBuyerFormProps) {
  const [buyer, setBuyer] = useState<BuyerDraft>(initialBuyer);
  const [lookupHint, setLookupHint] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const lastLookup = useRef("");

  useEffect(() => {
    setBuyer(initialBuyer);
  }, [initialBuyer.name, initialBuyer.whatsapp, initialBuyer.address]);

  async function lookupByWhatsapp(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) return;
    if (digits === lastLookup.current) return;
    lastLookup.current = digits;

    try {
      const res = await fetch(
        `/api/checkout/buyer?wa=${encodeURIComponent(digits)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        name?: string;
        whatsapp?: string;
        address?: string;
      } | null;
      if (!data) {
        setLookupHint(null);
        return;
      }
      setBuyer((prev) => ({
        name: prev.name.trim() ? prev.name : data.name || "",
        whatsapp: data.whatsapp || prev.whatsapp,
        address: prev.address.trim() ? prev.address : data.address || "",
      }));
      setLookupHint("Data ditemukan");
    } catch {
      // ignore
    }
  }

  const nameOk = buyer.name.trim().length > 0;
  const waOk = buyer.whatsapp.replace(/\D/g, "").length >= 10;
  const addressOk = buyer.address.trim().length > 0;
  const ready = nameOk && waOk && addressOk;
  const filledCount = [nameOk, waOk, addressOk].filter(Boolean).length;

  return (
    <div className={styles.wrap}>
      <section className={styles.panel} aria-label="Data pembeli">
        <div className={styles.head}>
          <div>
            <p className={styles.headTag}>Checkout</p>
            <h2 className={styles.headTitle}>Data pembeli</h2>
          </div>
          <span className={styles.headBadge} aria-label={`${filledCount} dari 3`}>
            {filledCount}/3
          </span>
        </div>

        <div className={styles.fields}>
          <label
            className={`${styles.field} ${focused === "name" ? styles.fieldOn : ""} ${
              nameOk ? styles.fieldOk : ""
            }`}
          >
            <span className={styles.fieldTop}>
              <span className={styles.fieldIcon} aria-hidden>
                <UserRound size={14} strokeWidth={2.4} />
              </span>
              <span className={styles.fieldLabel}>Nama</span>
              {nameOk ? (
                <span className={styles.fieldCheck} aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <input
              name="buyerName"
              value={buyer.name}
              onChange={(e) =>
                setBuyer((prev) => ({ ...prev, name: e.target.value }))
              }
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              placeholder="Nama lengkap"
              autoComplete="name"
              required
            />
          </label>

          <label
            className={`${styles.field} ${focused === "wa" ? styles.fieldOn : ""} ${
              waOk ? styles.fieldOk : ""
            }`}
          >
            <span className={styles.fieldTop}>
              <span className={styles.fieldIcon} aria-hidden>
                <Phone size={14} strokeWidth={2.4} />
              </span>
              <span className={styles.fieldLabel}>No. WhatsApp</span>
              {waOk ? (
                <span className={styles.fieldCheck} aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <input
              name="buyerWhatsapp"
              value={buyer.whatsapp}
              onChange={(e) => {
                setLookupHint(null);
                setBuyer((prev) => ({ ...prev, whatsapp: e.target.value }));
              }}
              onFocus={() => setFocused("wa")}
              onBlur={(e) => {
                setFocused(null);
                void lookupByWhatsapp(e.target.value);
              }}
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            {lookupHint ? (
              <span className={styles.hintOk}>{lookupHint}</span>
            ) : null}
          </label>

          <label
            className={`${styles.field} ${focused === "address" ? styles.fieldOn : ""} ${
              addressOk ? styles.fieldOk : ""
            }`}
          >
            <span className={styles.fieldTop}>
              <span className={styles.fieldIcon} aria-hidden>
                <MapPin size={14} strokeWidth={2.4} />
              </span>
              <span className={styles.fieldLabel}>Alamat</span>
              {addressOk ? (
                <span className={styles.fieldCheck} aria-hidden>
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <textarea
              name="buyerAddress"
              value={buyer.address}
              onChange={(e) =>
                setBuyer((prev) => ({ ...prev, address: e.target.value }))
              }
              onFocus={() => setFocused("address")}
              onBlur={() => setFocused(null)}
              placeholder="Alamat lengkap"
              rows={3}
              required
            />
          </label>
        </div>
      </section>

      <section className={styles.panel} aria-label="Bayar">
        <div className={styles.head}>
          <div>
            <p className={styles.headTag}>Pembayaran</p>
            <h2 className={styles.headTitle}>
              {whatsappOnly ? "Konfirmasi" : "Pilih metode"}
            </h2>
          </div>
        </div>
        <PaymentMethods
          qrisEnabled={qrisEnabled}
          bankTransferEnabled={bankTransferEnabled}
          buyer={buyer}
          disabled={!ready}
          whatsappOnly={whatsappOnly}
        />
      </section>
    </div>
  );
}
