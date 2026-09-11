"use client";

import { useRef, useState, useTransition } from "react";
import {
  ClipboardPaste,
  Crop,
  Eye,
  EyeOff,
  Link2,
  LoaderCircle,
  Maximize2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  addCollectionBannerAction,
  deleteCollectionBannerAction,
  toggleCollectionBannerHideAction,
} from "@/app/admin/(dashboard)/settings/actions";
import { BannerCropDialog } from "@/components/BannerCropDialog";
import { BannerLightbox } from "@/components/BannerLightbox";
import {
  COLLECTION_BANNER_MAX,
  type CollectionBannerItem,
} from "@/lib/collection-banner";
import { compressImageFile } from "@/lib/compress-image";
import { productImageUrl } from "@/lib/image-url";
import formStyles from "./ProductForm.module.css";
import styles from "./CollectionBannerAdmin.module.css";

type ImageMode = "upload" | "url" | "paste";

type CropJob = {
  src: string;
  revoke?: string;
};

type CollectionBannerAdminProps = {
  items: CollectionBannerItem[];
};

function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  const fromItems: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  if (fromItems.length > 0) return fromItems;
  return Array.from(data.files ?? []).filter((file) =>
    file.type.startsWith("image/")
  );
}

async function uploadCropped(file: File): Promise<string> {
  const compressed = await compressImageFile(file);
  const formData = new FormData();
  formData.append("files", compressed);
  const result = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const data = (await result.json().catch(() => null)) as
    | { urls?: string[]; error?: string }
    | null;
  if (!result.ok) throw new Error(data?.error || "Gagal");
  const url = data?.urls?.[0];
  if (!url) throw new Error("Gagal");
  return url;
}

async function srcFromUrl(url: string): Promise<CropJob> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("Gagal");
  if (trimmed.startsWith("/")) return { src: trimmed };
  const parsed = new URL(trimmed);
  if (!/^https?:$/i.test(parsed.protocol)) throw new Error("Gagal");
  const res = await fetch(trimmed);
  if (!res.ok) throw new Error("Gagal");
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Gagal");
  const objectUrl = URL.createObjectURL(blob);
  return { src: objectUrl, revoke: objectUrl };
}

export function CollectionBannerAdmin({ items }: CollectionBannerAdminProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteCatcherRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<CropJob[]>([]);
  const [mode, setMode] = useState<ImageMode>("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [awaitingPaste, setAwaitingPaste] = useState(false);
  const [crop, setCrop] = useState<CropJob | null>(null);
  const [viewSrc, setViewSrc] = useState<string | null>(null);

  const full = items.length >= COLLECTION_BANNER_MAX;

  function openNextFromQueue() {
    setCrop(queueRef.current.shift() ?? null);
  }

  function enqueueJobs(jobs: CropJob[]) {
    if (jobs.length === 0) return;
    if (crop) {
      queueRef.current.push(...jobs);
      return;
    }
    const [first, ...rest] = jobs;
    queueRef.current.push(...rest);
    setCrop(first ?? null);
  }

  function closeCrop() {
    if (crop?.revoke) URL.revokeObjectURL(crop.revoke);
    setCrop(null);
    openNextFromQueue();
  }

  function queueFiles(files: File[]) {
    setError(null);
    if (full) {
      setError("Max");
      return;
    }
    const room = COLLECTION_BANNER_MAX - items.length;
    const picked = files.slice(0, room);
    if (picked.length === 0) {
      setError("Gagal");
      return;
    }
    enqueueJobs(
      picked.map((file) => {
        const objectUrl = URL.createObjectURL(file);
        return { src: objectUrl, revoke: objectUrl };
      })
    );
  }

  function commitUrl(url: string) {
    const formData = new FormData();
    formData.set("imageUrl", url);
    startTransition(async () => {
      await addCollectionBannerAction(formData);
    });
  }

  async function handleCropConfirm(file: File) {
    const current = crop;
    if (!current) return;
    setError(null);
    try {
      const uploaded = await uploadCropped(file);
      if (current.revoke) URL.revokeObjectURL(current.revoke);
      setCrop(null);
      openNextFromQueue();
      commitUrl(uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
      if (current.revoke) URL.revokeObjectURL(current.revoke);
      setCrop(null);
      openNextFromQueue();
    }
  }

  function addUrl() {
    setError(null);
    const next = urlDraft.trim();
    if (!next) return;
    if (full) {
      setError("Max");
      return;
    }
    startTransition(async () => {
      try {
        const job = await srcFromUrl(next);
        setUrlDraft("");
        enqueueJobs([job]);
      } catch {
        setError("Gagal");
      }
    });
  }

  return (
    <div className={styles.wrap}>
      {crop ? (
        <BannerCropDialog
          src={crop.src}
          onCancel={closeCrop}
          onConfirm={handleCropConfirm}
        />
      ) : null}
      {viewSrc ? (
        <BannerLightbox src={viewSrc} onClose={() => setViewSrc(null)} />
      ) : null}

      {items.length > 0 ? (
        <ul className={styles.list} aria-label="Banner">
          {items.map((item) => {
            const thumb = productImageUrl(item.imageUrl, 480) ?? item.imageUrl;
            return (
              <li
                key={item.imageUrl}
                className={`${styles.card} ${item.isHidden ? styles.cardHidden : ""}`}
              >
                <button
                  type="button"
                  className={styles.preview}
                  aria-label="View"
                  title="View"
                  onClick={() => setViewSrc(item.imageUrl)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" />
                </button>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="View"
                    title="View"
                    onClick={() => setViewSrc(item.imageUrl)}
                  >
                    <Maximize2 size={14} strokeWidth={2.25} aria-hidden />
                  </button>
                  <form action={toggleCollectionBannerHideAction}>
                    <input type="hidden" name="imageUrl" value={item.imageUrl} />
                    <button
                      type="submit"
                      className={styles.iconBtn}
                      aria-label={item.isHidden ? "Show" : "Hide"}
                      title={item.isHidden ? "Show" : "Hide"}
                      disabled={pending}
                    >
                      {item.isHidden ? (
                        <Eye size={14} strokeWidth={2.25} aria-hidden />
                      ) : (
                        <EyeOff size={14} strokeWidth={2.25} aria-hidden />
                      )}
                    </button>
                  </form>
                  <form action={deleteCollectionBannerAction}>
                    <input type="hidden" name="imageUrl" value={item.imageUrl} />
                    <button
                      type="submit"
                      className={`${styles.iconBtn} ${styles.iconDanger}`}
                      aria-label="Hapus"
                      title="Hapus"
                      disabled={pending}
                    >
                      <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>Belum ada banner</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className={formStyles.fileHidden}
        disabled={pending || full}
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const list = e.target.files;
          if (!list?.length) return;
          queueFiles(Array.from(list));
          e.target.value = "";
        }}
      />

      <div className={formStyles.mediaPanel}>
        <div className={formStyles.modeTabs} role="tablist" aria-label="Sumber">
          <button
            type="button"
            role="tab"
            aria-label="Upload"
            title="Upload"
            aria-selected={mode === "upload"}
            className={`${formStyles.modeTab} ${mode === "upload" ? formStyles.modeTabOn : ""}`}
            onClick={() => setMode("upload")}
          >
            <Upload size={14} strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            role="tab"
            aria-label="URL"
            title="URL"
            aria-selected={mode === "url"}
            className={`${formStyles.modeTab} ${mode === "url" ? formStyles.modeTabOn : ""}`}
            onClick={() => setMode("url")}
          >
            <Link2 size={14} strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            role="tab"
            aria-label="Paste"
            title="Paste"
            aria-selected={mode === "paste"}
            className={`${formStyles.modeTab} ${mode === "paste" ? formStyles.modeTabOn : ""}`}
            onClick={() => setMode("paste")}
          >
            <ClipboardPaste size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        <div className={formStyles.mediaBody} role="tabpanel">
          {mode === "upload" ? (
            <button
              type="button"
              className={`${formStyles.mediaArea} ${dragOver ? formStyles.mediaAreaHot : ""}`}
              disabled={pending || full}
              aria-label="Upload"
              title="Upload"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                queueFiles(
                  Array.from(e.dataTransfer.files ?? []).filter((f) =>
                    f.type.startsWith("image/")
                  )
                );
              }}
            >
              {pending ? (
                <LoaderCircle
                  size={22}
                  strokeWidth={2.25}
                  className={formStyles.spin}
                  aria-hidden
                />
              ) : (
                <Upload size={22} strokeWidth={2.25} aria-hidden />
              )}
            </button>
          ) : null}

          {mode === "url" ? (
            <div className={formStyles.mediaArea}>
              <div className={formStyles.mediaAreaUrl}>
                <Link2 size={18} strokeWidth={2.25} aria-hidden />
                <input
                  type="text"
                  inputMode="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  disabled={full || pending}
                  aria-label="URL"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  className={formStyles.mediaAreaAction}
                  aria-label="Crop"
                  title="Crop"
                  onClick={addUrl}
                  disabled={full || pending || !urlDraft.trim()}
                >
                  <Crop size={16} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          {mode === "paste" ? (
            <div
              className={`${formStyles.mediaArea} ${formStyles.mediaPasteWrap} ${
                awaitingPaste ? formStyles.mediaAreaHot : ""
              }`}
            >
              <div
                ref={pasteCatcherRef}
                className={formStyles.pasteCatcher}
                contentEditable={!pending && !full}
                suppressContentEditableWarning
                role="textbox"
                aria-label="Paste"
                inputMode="none"
                onFocus={() => setAwaitingPaste(true)}
                onBlur={() => setAwaitingPaste(false)}
                onPaste={(e) => {
                  e.preventDefault();
                  queueFiles(filesFromClipboard(e.clipboardData));
                }}
              />
              <button
                type="button"
                className={formStyles.mediaPasteBtn}
                disabled={pending || full}
                aria-label="Paste"
                title="Paste"
                onClick={() => pasteCatcherRef.current?.focus()}
              >
                {pending ? (
                  <LoaderCircle
                    size={22}
                    strokeWidth={2.25}
                    className={formStyles.spin}
                    aria-hidden
                  />
                ) : (
                  <ClipboardPaste size={22} strokeWidth={2.25} aria-hidden />
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
