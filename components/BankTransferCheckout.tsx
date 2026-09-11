"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ImagePlus,
  Landmark,
  Upload,
} from "lucide-react";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { formatRupiah } from "@/lib/format";
import styles from "./BankTransferCheckout.module.css";

type BankAccountOption = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

type BankTransferCheckoutProps = {
  orderId: string;
  externalId: string;
  amount: number;
  accounts: BankAccountOption[];
  initialBankAccountId: number | null;
  initialProofUrl: string | null;
};

export function BankTransferCheckout({
  orderId,
  externalId,
  amount,
  accounts,
  initialBankAccountId,
  initialProofUrl,
}: BankTransferCheckoutProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<number | null>(
    initialBankAccountId ?? accounts[0]?.id ?? null
  );
  const [proofUrl, setProofUrl] = useState(initialProofUrl);
  const [preview, setPreview] = useState<string | null>(initialProofUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => accounts.find((a) => a.id === selectedId) ?? null,
    [accounts, selectedId]
  );

  const submitted = Boolean(proofUrl);

  async function copyAccountNumber() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  function onFileChange(file: File | null) {
    setError(null);
    selectedFileRef.current = file;
    if (!file) {
      setFileName(null);
      if (!proofUrl) setPreview(null);
      return;
    }
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId) {
      setError("Pilih rekening dulu");
      return;
    }
    const file = selectedFileRef.current ?? fileInputRef.current?.files?.[0] ?? null;
    if (!file || file.size <= 0) {
      setError("Upload bukti transfer");
      return;
    }

    const formData = new FormData();
    formData.set("bankAccountId", String(selectedId));
    formData.set("proof", file, file.name || "bukti.jpg");

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/checkout/${orderId}/proof`, {
          method: "POST",
          body: formData,
        });
        const data = (await res.json().catch(() => null)) as
          | { proofUrl?: string; error?: string }
          | null;

        if (!res.ok || data?.error) {
          setError(data?.error || "Gagal mengirim bukti");
          return;
        }
        if (!data?.proofUrl) {
          setError("Gagal menyimpan bukti");
          return;
        }

        setProofUrl(data.proofUrl);
        setPreview(data.proofUrl);
        selectedFileRef.current = null;
        router.refresh();
      } catch (err) {
        console.error("submit proof", err);
        setError(err instanceof Error ? err.message : "Gagal mengirim bukti");
      }
    });
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.hero} aria-label="Total transfer">
        <div className={styles.heroTop}>
          <span className={styles.heroMark} aria-hidden>
            <Landmark size={15} strokeWidth={2.4} />
          </span>
          <span className={styles.heroTag}>Transfer Bank</span>
        </div>
        <p className={styles.heroLabel}>Jumlah transfer</p>
        <p className={styles.heroAmount}>{formatRupiah(amount)}</p>
        <p className={styles.heroNote}>
          Transfer tepat sesuai nominal. Admin konfirmasi setelah bukti masuk.
        </p>
      </section>

      <section className={styles.panel} aria-label="Detail transfer">
        <div className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNum} aria-hidden>
              1
            </span>
            <div>
              <h2 className={styles.stepTitle}>Pilih rekening</h2>
              <p className={styles.stepSub}>Tujuan transfer</p>
            </div>
          </div>

          <div
            className={styles.accountList}
            role="radiogroup"
            aria-label="Rekening"
          >
            {accounts.map((account) => {
              const on = selectedId === account.id;
              return (
                <label
                  key={account.id}
                  className={`${styles.account} ${on ? styles.accountOn : ""} ${
                    submitted ? styles.accountLocked : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="bankAccountIdUi"
                    value={account.id}
                    checked={on}
                    disabled={submitted || pending}
                    onChange={() => setSelectedId(account.id)}
                  />
                  <span className={styles.accountCheck} aria-hidden>
                    {on ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  <span className={styles.accountBody}>
                    <span className={styles.accountBank}>{account.bankName}</span>
                    <span className={styles.accountName}>
                      a/n {account.accountName}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum} aria-hidden>
                2
              </span>
              <div>
                <h2 className={styles.stepTitle}>Transfer ke</h2>
                <p className={styles.stepSub}>
                  {selected.bankName} · a/n {selected.accountName}
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.copyCard} ${copied ? styles.copyCardDone : ""}`}
              onClick={() => void copyAccountNumber()}
              aria-label="Salin nomor rekening"
            >
              <div className={styles.copyMeta}>
                <span className={styles.copyLabel}>No. rekening</span>
                <span className={styles.copyNumber}>
                  {selected.accountNumber}
                </span>
              </div>
              <span className={styles.copyAction}>
                {copied ? (
                  <Check size={15} strokeWidth={2.75} aria-hidden />
                ) : (
                  <Copy size={15} strokeWidth={2.5} aria-hidden />
                )}
                <span>{copied ? "Disalin" : "Salin"}</span>
              </span>
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input type="hidden" name="orderId" value={orderId} />
          <input
            type="hidden"
            name="bankAccountId"
            value={selectedId ?? ""}
          />

          <div className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNum} aria-hidden>
                3
              </span>
              <div>
                <h2 className={styles.stepTitle}>Upload bukti</h2>
                <p className={styles.stepSub}>Screenshot / foto transfer</p>
              </div>
            </div>

            {preview ? (
              <div className={styles.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Bukti transfer" />
              </div>
            ) : (
              <button
                type="button"
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
                disabled={pending || submitted}
              >
                <span className={styles.dropIcon} aria-hidden>
                  <ImagePlus size={20} strokeWidth={2} />
                </span>
                <span className={styles.dropTitle}>Tambah bukti transfer</span>
                <span className={styles.dropHint}>JPG, PNG, atau WEBP · max 5MB</span>
              </button>
            )}

            {!submitted ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="proof"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.fileInput}
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
                {preview ? (
                  <button
                    type="button"
                    className={styles.pickBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pending}
                  >
                    <Upload size={14} strokeWidth={2.5} aria-hidden />
                    {fileName ? "Ganti gambar" : "Pilih gambar"}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          {submitted ? (
            <div className={styles.statusOk} role="status">
              <span className={styles.statusIcon} aria-hidden>
                <Check size={14} strokeWidth={3} />
              </span>
              <div>
                <p className={styles.statusTitle}>Bukti terkirim</p>
                <p className={styles.statusSub}>Menunggu konfirmasi admin</p>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={pending || !selectedId || !preview}
            >
              {pending ? "Mengirim..." : "Kirim bukti pembayaran"}
            </button>
          )}
        </form>

        <p className={styles.extId} title={externalId}>
          {externalId}
        </p>
      </section>

      <div className={styles.footer}>
        {submitted ? null : (
          <CancelOrderButton
            orderId={orderId}
            className={styles.btnSecondary}
          />
        )}
        <div className={styles.links}>
          <Link href="/orders?tab=pending" className={styles.linkBtn}>
            Lihat order
          </Link>
        </div>
      </div>
    </div>
  );
}
