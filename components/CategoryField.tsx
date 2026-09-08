"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import styles from "./ProductForm.module.css";

type Category = {
  id: number;
  name: string;
};

type CategoryFieldProps = {
  categories: Category[];
  defaultCategoryId?: number;
};

export function CategoryField({
  categories,
  defaultCategoryId,
}: CategoryFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = categories.find((c) => c.id === defaultCategoryId) ?? null;

  const [query, setQuery] = useState(initial?.name ?? "");
  const [selectedId, setSelectedId] = useState<number | null>(
    initial?.id ?? null
  );
  const [isNew, setIsNew] = useState(false);
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, trimmed]);

  const exact = useMemo(
    () =>
      categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ??
      null,
    [categories, trimmed]
  );

  const canAdd = Boolean(trimmed) && !exact;
  const valid = selectedId != null || (isNew && Boolean(trimmed));

  useEffect(() => {
    function onDocPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, []);

  function selectExisting(category: Category) {
    setSelectedId(category.id);
    setQuery(category.name);
    setIsNew(false);
    setOpen(false);
  }

  function selectNew() {
    if (!trimmed) return;
    setSelectedId(null);
    setIsNew(true);
    setQuery(trimmed);
    setOpen(false);
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    const match = categories.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      setSelectedId(match.id);
      setIsNew(false);
      return;
    }
    setSelectedId(null);
    setIsNew(false);
  }

  function onBlur() {
    window.setTimeout(() => {
      if (rootRef.current?.contains(document.activeElement)) return;
      setOpen(false);
      const text = query.trim();
      if (!text) {
        setSelectedId(null);
        setIsNew(false);
        return;
      }
      const match = categories.find(
        (c) => c.name.toLowerCase() === text.toLowerCase()
      );
      if (match) {
        setSelectedId(match.id);
        setIsNew(false);
        setQuery(match.name);
        return;
      }
      setSelectedId(null);
      setIsNew(true);
    }, 0);
  }

  return (
    <div className="form-row">
      <label htmlFor={`${listId}-input`}>Kategori</label>

      {selectedId != null && !isNew ? (
        <input type="hidden" name="categoryId" value={selectedId} />
      ) : null}
      {isNew && trimmed ? (
        <input type="hidden" name="newCategoryName" value={trimmed} />
      ) : null}

      <div className={styles.combo} ref={rootRef}>
        <div className={styles.comboControl}>
          <input
            id={`${listId}-input`}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            required={!valid}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && open) {
                e.preventDefault();
                if (filtered[0]) selectExisting(filtered[0]);
                else if (canAdd) selectNew();
              }
            }}
          />
          <button
            type="button"
            className={styles.comboToggle}
            aria-label="Daftar"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown size={14} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        {open ? (
          <ul id={listId} className={styles.comboList} role="listbox">
            {filtered.map((category) => (
              <li key={category.id} role="option">
                <button
                  type="button"
                  className={styles.comboOption}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectExisting(category)}
                >
                  {category.name}
                </button>
              </li>
            ))}
            {canAdd ? (
              <li role="option">
                <button
                  type="button"
                  className={`${styles.comboOption} ${styles.comboAdd}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={selectNew}
                >
                  <Plus size={14} strokeWidth={2.25} aria-hidden />
                  <span>{trimmed}</span>
                </button>
              </li>
            ) : null}
            {!filtered.length && !canAdd ? (
              <li className={styles.comboEmpty}>—</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
