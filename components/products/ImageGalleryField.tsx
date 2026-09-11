"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ClipboardPaste,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  deleteUploadedImageAction,
} from "@/app/admin/(dashboard)/products/actions";
import { filesFromClipboard } from "@/lib/client-upload";
import { MAX_UPLOAD_COUNT } from "@/lib/uploads-shared";
import { compressImageFiles } from "@/lib/compress-image";
import styles from "./ProductForm.module.css";

type ImageMode = "upload" | "url" | "paste";

type ImageGalleryFieldProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
};


export function ImageGalleryField({ urls, onChange }: ImageGalleryFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteCatcherRef = useRef<HTMLDivElement>(null);
  const urlsRef = useRef(urls);
  const [mode, setMode] = useState<ImageMode>("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [awaitingPaste, setAwaitingPaste] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  function removeAt(index: number) {
    const removed = urls[index];
    onChange(urls.filter((_, i) => i !== index));
    if (!removed) return;

    startTransition(async () => {
      try {
        await deleteUploadedImageAction(removed);
      } catch {
        // GC on save/delete still covers leftovers
      }
    });
  }

  function moveUrl(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= urls.length || to >= urls.length) {
      return;
    }
    const next = [...urls];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  function uploadFiles(files: File[]) {
    setError(null);
    const current = urlsRef.current;
    const room = MAX_UPLOAD_COUNT - current.length;
    if (room <= 0) {
      setError("Max");
      return;
    }
    const picked = files.slice(0, room);
    if (picked.length === 0) {
      setError("Gagal");
      return;
    }

    startTransition(async () => {
      try {
        const compressed = await compressImageFiles(picked);
        const formData = new FormData();
        for (const file of compressed) formData.append("files", file);

        const result = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const data = (await result.json().catch(() => null)) as
          | { urls?: string[]; error?: string }
          | null;
        if (!result.ok) {
          throw new Error(data?.error || "Gagal");
        }
        if (!data?.urls?.length) {
          throw new Error("Gagal");
        }
        onChange(Array.from(new Set([...urlsRef.current, ...data.urls])));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function addUrl() {
    setError(null);
    const next = urlDraft.trim();
    if (!next) return;
    if (urls.length >= MAX_UPLOAD_COUNT) {
      setError("Max");
      return;
    }
    try {
      if (next.startsWith("/")) {
        if (!next.startsWith("/uploads/")) {
          setError("Gagal");
          return;
        }
      } else {
        const parsed = new URL(next);
        if (!/^https?:$/i.test(parsed.protocol)) {
          setError("Gagal");
          return;
        }
      }
    } catch {
      setError("Gagal");
      return;
    }

    onChange(Array.from(new Set([...urls, next])));
    setUrlDraft("");
  }

  function onPasteEvent(e: React.ClipboardEvent) {
    const images = filesFromClipboard(e.clipboardData);
    if (images.length === 0) return;
    e.preventDefault();
    setAwaitingPaste(false);
    setError(null);
    uploadFiles(images);
    if (pasteCatcherRef.current) pasteCatcherRef.current.innerHTML = "";
  }

  async function pasteFromClipboard() {
    setError(null);
    if (urlsRef.current.length >= MAX_UPLOAD_COUNT) {
      setError("Max");
      return;
    }

    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        const files: File[] = [];
        for (const item of items) {
          const type = item.types.find((t) => t.startsWith("image/"));
          if (!type) continue;
          const blob = await item.getType(type);
          const ext = type.split("/")[1] || "png";
          files.push(new File([blob], `paste.${ext}`, { type }));
        }
        if (files.length > 0) {
          setAwaitingPaste(false);
          uploadFiles(files);
          return;
        }
      }
    } catch {
      // Fall through to mobile/system paste catcher
    }

    setAwaitingPaste(true);
    const el = pasteCatcherRef.current;
    if (!el) return;
    el.focus();
    // Some mobile browsers need a selection for paste menu
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  useEffect(() => {
    if (mode !== "paste") {
      setAwaitingPaste(false);
      return;
    }
  }, [mode]);

  const full = urls.length >= MAX_UPLOAD_COUNT;

  function openFilePicker() {
    if (pending || full) return;
    inputRef.current?.click();
  }

  return (
    <div className="form-row">
      <label>Gambar</label>
      <input type="hidden" name="imageUrls" value={urls.join("\n")} />
      <input
        ref={inputRef}
        id="imageUpload"
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
          uploadFiles(Array.from(list));
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
          <div className={styles.gallery} aria-label="Urutan gambar">
            {urls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className={`${styles.galleryItem} ${
                  index === 0 ? styles.galleryCover : ""
                } ${dragIndex === index ? styles.galleryDragging : ""} ${
                  overIndex === index && dragIndex !== index
                    ? styles.galleryDropTarget
                    : ""
                }`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDragLeave={() => {
                  if (overIndex === index) setOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
                  setDragIndex(null);
                  setOverIndex(null);
                  if (Number.isNaN(from)) return;
                  moveUrl(from, index);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" draggable={false} />
                {index === 0 ? (
                  <span className={styles.galleryCoverBadge} title="Thumbnail">
                    <ImageIcon size={10} strokeWidth={2.5} aria-hidden />
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.galleryRemove}
                  aria-label="Hapus"
                  title="Hapus"
                  onClick={() => removeAt(index)}
                  onMouseDown={(e) => e.stopPropagation()}
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
              onClick={openFilePicker}
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
                const list = e.dataTransfer.files;
                if (!list?.length) return;
                uploadFiles(
                  Array.from(list).filter((f) => f.type.startsWith("image/"))
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
                  id="imageUrlInput"
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
                  disabled={full}
                  aria-label="URL"
                />
                <button
                  type="button"
                  className={styles.mediaAreaAction}
                  aria-label="Tambah"
                  title="Tambah"
                  onClick={addUrl}
                  disabled={full || !urlDraft.trim()}
                >
                  <Plus size={16} strokeWidth={2.25} aria-hidden />
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
                onPaste={onPasteEvent}
              />
              <button
                type="button"
                className={styles.mediaPasteBtn}
                disabled={pending || full}
                aria-label="Paste"
                title="Paste"
                onClick={() => {
                  void pasteFromClipboard();
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
