"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import {
  DEFAULT_LISTING_SORT,
  FILTER_PARAM_KEYS,
  LISTING_SORT_OPTIONS,
  type ListingSort,
} from "@/lib/listingFilters";

type Props = {
  value: ListingSort;
  /** Kompakte Variante ohne umschließenden Rahmen (z. B. in der Filterleiste). */
  compact?: boolean;
};

/**
 * Sortier-Dropdown für Inserats-Listen. Schreibt die Auswahl in den
 * `sort`-URL-Parameter und erhält dabei alle übrigen Query-Parameter (Filter),
 * damit Sortierung und Filter unabhängig voneinander funktionieren.
 */
export default function ListingSortSelect({ value, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    // Verhindert, dass eine umgebende <form> ihren onChange-Handler auslöst
    // (die Filterleiste würde sonst ihre Parameter neu aufbauen).
    event.stopPropagation();
    const next = event.target.value as ListingSort;
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_LISTING_SORT) params.delete(FILTER_PARAM_KEYS.sort);
    else params.set(FILTER_PARAM_KEYS.sort, next);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const select = (
    <select
      value={value}
      onChange={onChange}
      aria-label="Inserate sortieren"
      className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {LISTING_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (compact) return select;

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="whitespace-nowrap">Sortieren nach</span>
      {select}
    </label>
  );
}
