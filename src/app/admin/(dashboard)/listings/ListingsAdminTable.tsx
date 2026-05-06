"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ListingAdminRow = {
  id: string;
  title: string;
  listing_type: "kauf" | "miete" | "kauf_und_miete";
  published: boolean;
  price_cents: number | null;
  daily_rate_cents: number | null;
  brand: string | null;
  article_number: string | null;
  category_id: string;
  created_at: string;
};

type CategoryOption = { id: string; name: string };

type Props = {
  listings: ListingAdminRow[];
  categories: CategoryOption[];
};

function effectivePriceCents(row: ListingAdminRow): number | null {
  if (row.price_cents != null) return row.price_cents;
  if (row.daily_rate_cents != null) return row.daily_rate_cents;
  return null;
}

function parseEuroToCents(value: string): number | null {
  const t = value.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function ListingsAdminTable({ listings, categories }: Props) {
  const [brand, setBrand] = useState("");
  const [articleNumber, setArticleNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const hasActiveFilters =
    brand.trim() !== "" ||
    articleNumber.trim() !== "" ||
    categoryId !== "" ||
    priceMin.trim() !== "" ||
    priceMax.trim() !== "";

  const filtered = useMemo(() => {
    const b = brand.trim().toLowerCase();
    const art = articleNumber.trim().toLowerCase();
    const minC = parseEuroToCents(priceMin);
    const maxC = parseEuroToCents(priceMax);

    return listings.filter((row) => {
      if (b && !(row.brand ?? "").toLowerCase().includes(b)) {
        return false;
      }
      if (art && !(row.article_number ?? "").toLowerCase().includes(art)) {
        return false;
      }
      if (categoryId && row.category_id !== categoryId) {
        return false;
      }
      if (minC != null || maxC != null) {
        const cents = effectivePriceCents(row);
        if (cents == null) return false;
        if (minC != null && cents < minC) return false;
        if (maxC != null && cents > maxC) return false;
      }
      return true;
    });
  }, [
    listings,
    brand,
    articleNumber,
    categoryId,
    priceMin,
    priceMax,
  ]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500";

  if (!listings.length) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">Noch keine Inserate.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length} von {listings.length} Einträgen
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setBrand("");
              setArticleNumber("");
              setCategoryId("");
              setPriceMin("");
              setPriceMax("");
            }}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Filter zurücksetzen
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Marke
          <input
            type="search"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="enthält …"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Art.-Nr.
          <input
            type="search"
            value={articleNumber}
            onChange={(e) => setArticleNumber(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="enthält …"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Kategorie
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            <option value="">Alle</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Preis von (€)
          <input
            type="text"
            inputMode="decimal"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="z. B. 100"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Preis bis (€)
          <input
            type="text"
            inputMode="decimal"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="z. B. 5000"
          />
        </label>
      </div>

      {!filtered.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Keine Treffer für aktuelle Filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Titel</th>
                <th className="px-4 py-3 font-medium">Art.-Nr.</th>
                <th className="px-4 py-3 font-medium">Marke</th>
                <th className="px-4 py-3 font-medium">Kategorie</th>
                <th className="px-4 py-3 font-medium">Preis</th>
                <th className="px-4 py-3 font-medium">Art</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const priceCents = effectivePriceCents(l);
                return (
                  <tr
                    key={l.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">{l.title}</td>
                    <td className="px-4 py-3">{l.article_number ?? "—"}</td>
                    <td className="px-4 py-3">{l.brand ?? "—"}</td>
                    <td className="px-4 py-3">
                      {categoryNameById.get(l.category_id) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {priceCents != null ? `${(priceCents / 100).toFixed(2)} €` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {l.listing_type === "miete"
                        ? "Miete"
                        : l.listing_type === "kauf_und_miete"
                          ? "Kauf + Miete"
                          : "Kauf"}
                    </td>
                    <td className="px-4 py-3">
                      {l.published ? (
                        <span className="text-emerald-600">veröffentlicht</span>
                      ) : (
                        <span className="text-zinc-500">Entwurf</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/listings/${l.id}`}
                        className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
