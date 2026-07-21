"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEurFromCents, formatPercentDe } from "@/lib/format";
import { marginPercent } from "@/lib/vat";
import { buildAdjustment, computeAdjustedCents } from "@/lib/priceIncrease";
import {
  applyPriceIncrease,
  type ApplyPriceIncreaseState,
} from "./actions";

export type BulkItem = {
  kind: "listing" | "accessory";
  id: string;
  name: string;
  brand: string | null;
  article_number: string | null;
  category_id: string | null;
  /** VK brutto; bei Inseraten ohne Kaufpreis null. */
  vk_cents: number | null;
  ek_net_cents: number | null;
  /** Zubehör: inaktiv, Inserate: unveröffentlicht. */
  inactive: boolean;
};

export type BulkCategory = { id: string; name: string };

type Props = {
  accessories: BulkItem[];
  listings: BulkItem[];
  accessoryCategories: BulkCategory[];
};

type EkMode = "none" | "absolute" | "percent";
type VkMode = "none" | "percent";

const inputClass =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950";
const badgeEkFehlt = (
  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
    EK fehlt
  </span>
);

export default function BulkPriceTool({
  accessories,
  listings,
  accessoryCategories,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ApplyPriceIncreaseState,
    FormData
  >(applyPriceIncrease, undefined);
  const [kind, setKind] = useState<"accessory" | "listing">("accessory");
  const [nameFilter, setNameFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ekMode, setEkMode] = useState<EkMode>("none");
  const [ekValue, setEkValue] = useState("");
  const [vkMode, setVkMode] = useState<VkMode>("none");
  const [vkValue, setVkValue] = useState("");
  const [roundEuro, setRoundEuro] = useState(true);

  // Nach erfolgreicher Anwendung neue Werte vom Server laden, Auswahl leeren.
  useEffect(() => {
    if (state?.ok) {
      setSelected(new Set());
      router.refresh();
    }
  }, [router, state]);

  const items = kind === "accessory" ? accessories : listings;
  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const brand = brandFilter.trim().toLowerCase();
    return items.filter((item) => {
      if (name) {
        const haystack = [item.name, item.article_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(name)) return false;
      }
      if (brand && !(item.brand ?? "").toLowerCase().includes(brand)) {
        return false;
      }
      if (
        kind === "accessory" &&
        categoryFilter &&
        item.category_id !== categoryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [brandFilter, categoryFilter, items, kind, nameFilter]);

  const selectedItems = filtered.filter((item) => selected.has(item.id));
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  function switchKind(next: "accessory" | "listing") {
    if (next === kind) return;
    setKind(next);
    setSelected(new Set());
    setCategoryFilter("");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const item of filtered) next.delete(item.id);
      } else {
        for (const item of filtered) next.add(item.id);
      }
      return next;
    });
  }

  const ekAdj = buildAdjustment(ekMode, ekValue);
  const vkAdj = buildAdjustment(vkMode, vkValue);
  const hasChange = ekMode !== "none" || vkMode !== "none";
  const inputsValid =
    (ekMode === "none" || ekAdj != null) && (vkMode === "none" || vkAdj != null);
  const showPreview = selectedItems.length > 0 && hasChange && inputsValid;

  const summaryBits: string[] = [];
  if (ekMode === "absolute") summaryBits.push(`EK +${ekValue || "…"} €`);
  if (ekMode === "percent") summaryBits.push(`EK +${ekValue || "…"} %`);
  if (vkMode === "percent")
    summaryBits.push(
      `VK +${vkValue || "…"} %${roundEuro ? ", auf volle Euro gerundet" : ""}`,
    );

  const numCell = "px-3 py-2 text-right tabular-nums";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["accessory", "Zubehör"],
            ["listing", "Inserate"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => switchKind(value)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${
              kind === value
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Name / Art.-Nr. …"
          className={`min-w-0 flex-1 ${inputClass}`}
        />
        <input
          type="search"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          placeholder="Marke …"
          className={`w-40 ${inputClass}`}
        />
        {kind === "accessory" ? (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">Alle Kategorien</option>
            {accessoryCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-xs text-zinc-500">
          {filtered.length} von {items.length} Einträgen
          {selectedItems.length > 0 ? ` · ${selectedItems.length} ausgewählt` : ""}
        </span>
        {selected.size > selectedItems.length ? (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {selected.size - selectedItems.length} ausgewählte Einträge sind
            durch Filter ausgeblendet und werden nicht geändert.
          </span>
        ) : null}
        {nameFilter || brandFilter || categoryFilter ? (
          <button
            type="button"
            onClick={() => {
              setNameFilter("");
              setBrandFilter("");
              setCategoryFilter("");
            }}
            className="text-xs text-amber-700 hover:underline dark:text-amber-400"
          >
            Filter zurücksetzen
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  aria-label="Alle (gefiltert) auswählen"
                />
              </th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Marke</th>
              <th className="px-3 py-2 font-medium">Art.-Nr.</th>
              <th className="px-3 py-2 text-right font-medium">VK brutto</th>
              <th className="px-3 py-2 text-right font-medium">EK netto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                onClick={() => toggle(item.id)}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${item.name} auswählen`}
                  />
                </td>
                <td className="px-3 py-2">
                  {item.name}
                  {item.inactive ? (
                    <span className="ml-2 text-xs text-zinc-400">
                      ({kind === "accessory" ? "inaktiv" : "unveröffentlicht"})
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2">{item.brand ?? "—"}</td>
                <td className="px-3 py-2">{item.article_number ?? "—"}</td>
                <td className={numCell}>
                  {item.vk_cents != null ? formatEurFromCents(item.vk_cents) : "—"}
                </td>
                <td className={numCell}>
                  {item.ek_net_cents != null
                    ? formatEurFromCents(item.ek_net_cents)
                    : badgeEkFehlt}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-zinc-500">
                  Keine Einträge gefunden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <form
        action={formAction}
        className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
      >
        <input
          type="hidden"
          name="targets"
          value={JSON.stringify(
            selectedItems.map((item) => ({ kind: item.kind, id: item.id })),
          )}
        />
        <p className="text-sm font-medium">Anpassung</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="w-28 text-sm font-medium" htmlFor="bulk_ek_mode">
            EK-Anpassung
          </label>
          <select
            id="bulk_ek_mode"
            name="ek_mode"
            value={ekMode}
            onChange={(e) => setEkMode(e.target.value as EkMode)}
            className={inputClass}
          >
            <option value="none">unverändert</option>
            <option value="absolute">Betrag (+ EUR)</option>
            <option value="percent">Prozent (+ %)</option>
          </select>
          {ekMode !== "none" ? (
            <input
              name="ek_value"
              type="number"
              step={ekMode === "percent" ? "0.1" : "0.01"}
              value={ekValue}
              onChange={(e) => setEkValue(e.target.value)}
              placeholder={ekMode === "percent" ? "z. B. 5" : "z. B. 100,00"}
              className={`w-40 ${inputClass}`}
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="w-28 text-sm font-medium" htmlFor="bulk_vk_mode">
            VK-Anpassung
          </label>
          <select
            id="bulk_vk_mode"
            name="vk_mode"
            value={vkMode}
            onChange={(e) => setVkMode(e.target.value as VkMode)}
            className={inputClass}
          >
            <option value="none">unverändert</option>
            <option value="percent">Prozent (+ %)</option>
          </select>
          {vkMode !== "none" ? (
            <input
              name="vk_value"
              type="number"
              step="0.1"
              value={vkValue}
              onChange={(e) => setVkValue(e.target.value)}
              placeholder="z. B. 5"
              className={`w-40 ${inputClass}`}
            />
          ) : null}
        </div>
        {vkMode !== "none" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="vk_rounding"
              value="euro"
              checked={roundEuro}
              onChange={(e) => setRoundEuro(e.target.checked)}
              className="rounded border-zinc-300"
            />
            VK auf volle Euro runden
          </label>
        ) : null}
        {kind === "listing" ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hinweis: Bei Inseraten wird nur der Kaufpreis angepasst —
            Miet-Tagessätze bleiben unverändert.
          </p>
        ) : null}

        {showPreview ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left dark:bg-zinc-800">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 text-right font-medium">
                    EK alt → neu
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    VK alt → neu
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Marge neu %
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => {
                  const newEk =
                    ekMode === "none" || ekAdj == null
                      ? item.ek_net_cents
                      : computeAdjustedCents(item.ek_net_cents, ekAdj, "cent");
                  const newVk =
                    vkMode === "none" || vkAdj == null
                      ? item.vk_cents
                      : computeAdjustedCents(
                          item.vk_cents,
                          vkAdj,
                          roundEuro ? "euro" : "cent",
                        );
                  const newMarginPct = marginPercent(newVk, newEk);
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-200 dark:border-zinc-700"
                    >
                      <td className="px-3 py-2">{item.name}</td>
                      <td className={numCell}>
                        {ekMode !== "none" && item.ek_net_cents == null ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            EK fehlt — wird übersprungen
                          </span>
                        ) : (
                          <>
                            {item.ek_net_cents != null
                              ? formatEurFromCents(item.ek_net_cents)
                              : "—"}
                            {ekMode !== "none" && newEk != null
                              ? ` → ${formatEurFromCents(newEk)}`
                              : ""}
                          </>
                        )}
                      </td>
                      <td className={numCell}>
                        {vkMode !== "none" && item.vk_cents == null ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            kein VK — wird übersprungen
                          </span>
                        ) : (
                          <>
                            {item.vk_cents != null
                              ? formatEurFromCents(item.vk_cents)
                              : "—"}
                            {vkMode !== "none" && newVk != null
                              ? ` → ${formatEurFromCents(newVk)}`
                              : ""}
                          </>
                        )}
                      </td>
                      <td className={numCell}>
                        {newMarginPct == null ? "—" : formatPercentDe(newMarginPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {state?.ok === false ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <>
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-200">
              {state.updatedVk} VK und {state.updatedEk} EK aktualisiert
              {state.skippedMissingEk > 0
                ? `, ${state.skippedMissingEk} ohne EK übersprungen`
                : ""}
              {state.skippedMissingVk > 0
                ? `, ${state.skippedMissingVk} ohne VK übersprungen`
                : ""}
              .
            </p>
            {state.failedVk > 0 || state.failedEk > 0 || state.warning ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                {state.failedVk > 0 || state.failedEk > 0
                  ? `Fehlgeschlagen: ${state.failedVk} VK, ${state.failedEk} EK — diese Einträge wurden nicht geändert. `
                  : ""}
                {state.warning ?? ""}
              </p>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || selectedItems.length === 0 || !hasChange || !inputsValid}
            className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {pending
              ? "Wird angewendet…"
              : `Auf ${selectedItems.length} ${
                  selectedItems.length === 1 ? "Eintrag" : "Einträge"
                } anwenden`}
          </button>
          {summaryBits.length > 0 && selectedItems.length > 0 ? (
            <span className="text-xs text-zinc-500">
              {summaryBits.join(" · ")}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
