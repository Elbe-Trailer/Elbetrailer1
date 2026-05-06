"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AccessoryAdminRow = {
  id: string;
  name: string;
  brand: string | null;
  article_number: string | null;
  price_adjustment_cents: number;
  active: boolean;
  category_id: string | null;
};

type AccessoryCategoryOption = { id: string; name: string };

type Props = {
  rows: AccessoryAdminRow[];
  accessoryCategories: AccessoryCategoryOption[];
};

function parseEuroToCents(value: string): number | null {
  const t = value.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function AccessoriesAdminTable({
  rows,
  accessoryCategories,
}: Props) {
  const [brand, setBrand] = useState("");
  const [articleNumber, setArticleNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of accessoryCategories) {
      m.set(c.id, c.name);
    }
    return m;
  }, [accessoryCategories]);

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

    return rows.filter((row) => {
      if (b && !(row.brand ?? "").toLowerCase().includes(b)) {
        return false;
      }
      if (art && !(row.article_number ?? "").toLowerCase().includes(art)) {
        return false;
      }
      if (categoryId) {
        if (row.category_id !== categoryId) return false;
      }
      if (minC != null || maxC != null) {
        const cents = row.price_adjustment_cents;
        if (minC != null && cents < minC) return false;
        if (maxC != null && cents > maxC) return false;
      }
      return true;
    });
  }, [rows, brand, articleNumber, categoryId, priceMin, priceMax]);

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500";

  if (!rows.length) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">Noch keine Einträge.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length} von {rows.length} Einträgen
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
            {accessoryCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Aufschlag von (€)
          <input
            type="text"
            inputMode="decimal"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="z. B. -50"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Aufschlag bis (€)
          <input
            type="text"
            inputMode="decimal"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className={`${inputClass} mt-1`}
            placeholder="z. B. 200"
          />
        </label>
      </div>

      {!filtered.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Keine Treffer für aktuelle Filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Marke</th>
                <th className="px-4 py-3 font-medium">Art.-Nr.</th>
                <th className="px-4 py-3 font-medium">Kategorie</th>
                <th className="px-4 py-3 font-medium">Aufschlag</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.brand ?? "—"}</td>
                  <td className="px-4 py-3">{r.article_number ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.category_id
                      ? (categoryNameById.get(r.category_id) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {(r.price_adjustment_cents / 100).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    {r.active ? "aktiv" : "inaktiv"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/accessories/${r.id}`}
                      className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
