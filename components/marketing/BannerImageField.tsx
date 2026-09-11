"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ClipboardPaste,
  Crop,
  Link2,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import { deleteUploadedImageAction } from "@/app/admin/(dashboard)/products/actions";
import { BannerCropDialog } from "@/components/BannerCropDialog";
import { COLLECTION_BANNER_MAX } from "@/lib/collection-banner";
import {
  filesFromClipboard,
  srcFromImageUrl,
  uploadImageFile,
} from "@/lib/client-upload";
import styles from "@/components/products/ProductForm.module.css";
import bannerStyles from "./BannerImageField.module.css";

type ImageMode = "upload" | "url" | "paste";

type CropJob = {
  src: string;
  revoke?: string;
  replaceIndex?: number;
};

type BannerImageFieldProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
};

async function uploadCropped(file: File): Promise<string> {
  return uploadImageFile(file);
}

async function srcFromUrl(url: string): Promise<CropJob> {
  return srcFromImageUrl(url);
}

export function BannerImageField({ urls, onChange }: BannerImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteCatcherRef = useRef<HTMLDivElement>(null);
  const urlsRef = useRef(urls);
  const queueRef = useRef<CropJob[]>([]);
  const [mode, setMode] = useState<ImageMode>("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [awaitingPaste, setAwaitingPaste] = useState(false);
  const [crop, setCrop] = useState<CropJob | null>(null);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  function openNextFromQueue() {
    const next = queueRef.current.shift() ?? null;
    setCrop(next);
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
    const room = COLLECTION_BANNER_MAX - urlsRef.current.length;
    if (room <= 0) {
      setError("Max");
      return;
    }
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

  function removeAt(index: number) {
    const removed = urls[index];
    onChange(urls.filter((_, i) => i !== index));
    if (!removed) return;
    startTransition(async () => {
      try {
        await deleteUploadedImageAction(removed);
      } catch {
        // GC on save still covers leftovers
      }
    });
  }

  function startRecrop(index: number) {
    const url = urls[index];
    if (!url) return;
    setError(null);
    startTransition(async () => {
      try {
        const job = await srcFromUrl(url);
        enqueueJobs([{ ...job, replaceIndex: index }]);
      } catch {
        setError("Gagal");
      }
    });
  }

  async function handleCropConfirm(file: File) {
    const current = crop;
    if (!current) return;
    setError(null);
    try {
      const uploaded = await uploadCropped(file);
      const list = [...urlsRef.current];
      if (
        typeof current.replaceIndex === "number" &&
        current.replaceIndex >= 0 &&
        current.replaceIndex < list.length
      ) {
        const prev = list[current.replaceIndex];
        list[current.replaceIndex] = uploaded;
        onChange(list);
        if (prev && prev !== uploaded) {
          try {
            await deleteUploadedImageAction(prev);
          } catch {
            // ignore
          }
        }
      } else {
        onChange(Array.from(new Set([...list, uploaded])));
      }
      if (current.revoke) URL.revokeObjectURL(current.revoke);
      setCrop(null);
      openNextFromQueue();
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
    if (urlsRef.current.length >= COLLECTION_BANNER_MAX) {
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

  const full = urls.length >= COLLECTION_BANNER_MAX;

  return (
    <div>
      {crop ? (
        <BannerCropDialog
          src={crop.src}
          onCancel={closeCrop}
          onConfirm={handleCropConfirm}
        />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className={styles.fileHidden}
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

      <div className={styles.mediaPanel}>
        <div className={styles.modeTabs} role="tablist" aria-label="Sumber">
          <button
            type="button"
            role="tab"
            aria-label="Upload"
            title="Upload"
            aria-selected={mode === "upload"}
            className={`${styles.modeTab} ${mode === "upload" ? styles.modeTabOn : ""}`}
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
            className={`${styles.modeTab} ${mode === "url" ? styles.modeTabOn : ""}`}
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
            className={`${styles.modeTab} ${mode === "paste" ? styles.modeTabOn : ""}`}
            onClick={() => setMode("paste")}
          >
            <ClipboardPaste size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        {urls.length > 0 ? (
          <div
            className={`${styles.gallery} ${bannerStyles.gallery}`}
            aria-label="Banner"
          >
            {urls.map((url, index) => (
              <div key={`${url}-${index}`} className={styles.galleryItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" draggable={false} />
                <button
                  type="button"
                  className={bannerStyles.cropBtn}
                  aria-label="Crop"
                  title="Crop"
                  onClick={() => startRecrop(index)}
                >
                  <Crop size={12} strokeWidth={2.5} aria-hidden />
                </button>
                <button
                  type="button"
                  className={styles.galleryRemove}
                  aria-label="Hapus"
                  title="Hapus"
                  onClick={() => removeAt(index)}
                >
                  <X size={12} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.mediaBody} role="tabpanel">
          {mode === "upload" ? (
            <button
              type="button"
              className={`${styles.mediaArea} ${dragOver ? styles.mediaAreaHot : ""}`}
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
                  className={styles.spin}
                  aria-hidden
                />
              ) : (
                <Upload size={22} strokeWidth={2.25} aria-hidden />
              )}
            </button>
          ) : null}

          {mode === "url" ? (
            <div className={styles.mediaArea}>
              <div className={styles.mediaAreaUrl}>
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
                  className={styles.mediaAreaAction}
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
              className={`${styles.mediaArea} ${styles.mediaPasteWrap} ${
                awaitingPaste ? styles.mediaAreaHot : ""
              }`}
            >
              <div
                ref={pasteCatcherRef}
                className={styles.pasteCatcher}
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
                className={styles.mediaPasteBtn}
                disabled={pending || full}
                aria-label="Paste"
                title="Paste"
                onClick={() => pasteCatcherRef.current?.focus()}
              >
                {pending ? (
                  <LoaderCircle
                    size={22}
                    strokeWidth={2.25}
                    className={styles.spin}
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
