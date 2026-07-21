"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  DEFAULT_LISTING_SORT,
  FILTER_PARAM_KEYS,
  LISTING_SORT_OPTIONS,
  type ListingSort,
} from "@/lib/listingFilters";

type Props = {
  value: ListingSort;
  /** Kompakte Variante ohne vorangestelltes Label (z. B. in der Filterleiste). */
  compact?: boolean;
};

function IconSort({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h5" />
    </svg>
  );
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/**
 * Sortier-Dropdown für Inserats-Listen. Eigenes Popover statt nativem
 * <select> — damit es optisch zu den Filter-Chips passt und die Position
 * bzw. Stapelung (z-index) kontrolliert wird und sich nicht mit der
 * Filterleiste überlagert.
 *
 * Schreibt die Auswahl in den `sort`-URL-Parameter und erhält dabei alle
 * übrigen Query-Parameter (Filter), damit Sortierung und Filter unabhängig
 * voneinander funktionieren.
 */
export default function ListingSortSelect({ value, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const currentOption =
    LISTING_SORT_OPTIONS.find((option) => option.value === value) ?? LISTING_SORT_OPTIONS[0];

  const selectSort = (next: ListingSort) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (next === value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_LISTING_SORT) params.delete(FILTER_PARAM_KEYS.sort);
    else params.set(FILTER_PARAM_KEYS.sort, next);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  // Beim Öffnen den aktiven Eintrag fokussieren (Tastatur-Navigation).
  useEffect(() => {
    if (!open) return;
    const listbox = listboxRef.current;
    if (!listbox) return;
    const options = listbox.querySelectorAll<HTMLButtonElement>('[role="option"]');
    const activeIndex = LISTING_SORT_OPTIONS.findIndex((option) => option.value === value);
    (options[activeIndex] ?? options[0])?.focus();
  }, [open, value]);

  // Klick außerhalb / Escape schließt das Dropdown.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && wrapperRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onListboxKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const listbox = listboxRef.current;
    if (!listbox) return;
    const options = Array.from(listbox.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    const currentIndex = options.findIndex((el) => el === document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    options[nextIndex]?.focus();
  };

  const control = (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onBlur={(event) => {
        // Verlässt der Fokus das Dropdown (z. B. per Tab), schließen. Interne
        // Fokuswechsel (Button ↔ Optionen) lassen es offen. Ergänzt Klick-
        // außerhalb/Escape, die keinen Tastatur-Fokuswechsel abdecken.
        if (
          event.relatedTarget instanceof Node &&
          wrapperRef.current?.contains(event.relatedTarget)
        ) {
          return;
        }
        setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Inserate sortieren, aktuell: ${currentOption.label}`}
        className={`inline-flex touch-manipulation items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
          open
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <IconSort className="shrink-0 opacity-70" />
        <span className="whitespace-nowrap">{currentOption.label}</span>
        <IconChevron className={`shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          ref={listboxRef}
          role="listbox"
          aria-label="Sortierung"
          onKeyDown={onListboxKeyDown}
          className="absolute right-0 top-[calc(100%+6px)] z-[70] min-w-[13rem] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {LISTING_SORT_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={(event) => {
                  event.stopPropagation();
                  selectSort(option.value);
                }}
                className={`flex w-full touch-manipulation items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  selected
                    ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="whitespace-nowrap">{option.label}</span>
                {selected ? <IconCheck className="shrink-0 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  if (compact) return control;

  return (
    <div className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="whitespace-nowrap">Sortieren nach</span>
      {control}
    </div>
  );
}
