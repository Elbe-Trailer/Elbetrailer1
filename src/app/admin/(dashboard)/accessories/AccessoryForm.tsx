"use client";

import { useActionState, useState } from "react";
import type {
  Accessory,
  AccessoryCategory,
  AccessoryCost,
  VkInputMode,
} from "@/types/database";
import { formatEurFromCents } from "@/lib/format";
import {
  grossToNetCents,
  marginCents,
  marginPercent,
  netToGrossCents,
} from "@/lib/vat";
import {
  centsToEurString,
  convertEurString,
  eurStringToCents,
} from "@/components/admin/priceInput";
import SuccessChoiceDialog from "@/components/admin/SuccessChoiceDialog";
import { saveAccessory, type SaveAccessoryState } from "./actions";

type Props = {
  accessory?: Accessory;
  categories: Pick<AccessoryCategory, "id" | "name">[];
  cost?: AccessoryCost | null;
};

export default function AccessoryForm({ accessory, categories, cost = null }: Props) {
  const [state, formAction, pending] = useActionState<
    SaveAccessoryState,
    FormData
  >(saveAccessory, undefined);

  const accessoryCreated =
    state?.ok === true && state.created === true ? state : null;

  // Gespeichert ist immer Brutto; das Feld zeigt den Wert im gewählten Modus.
  const initialVkMode: VkInputMode = cost?.vk_input_mode ?? "brutto";
  const [vkMode, setVkMode] = useState<VkInputMode>(initialVkMode);
  const [priceEur, setPriceEur] = useState(() =>
    accessory != null
      ? centsToEurString(
          initialVkMode === "netto"
            ? grossToNetCents(accessory.price_adjustment_cents)
            : accessory.price_adjustment_cents,
        )
      : "0",
  );
  const [purchaseNetEur, setPurchaseNetEur] = useState(() =>
    cost?.purchase_price_net_cents != null
      ? centsToEurString(cost.purchase_price_net_cents)
      : "",
  );

  function switchVkMode(next: VkInputMode) {
    if (next === vkMode) return;
    setPriceEur((v) => convertEurString(v, vkMode, next));
    setVkMode(next);
  }

  // Nach einem Server-Refresh (z. B. durch das "Preise anpassen"-Panel auf
  // derselben Seite) die Preisfelder aus den neuen Props neu initialisieren —
  // sonst würde ein späteres Speichern die Anpassung stillschweigend
  // zurückdrehen ("adjust state during render"-Muster).
  const priceSyncKey = [
    accessory?.price_adjustment_cents ?? "",
    cost?.purchase_price_net_cents ?? "",
    cost?.vk_input_mode ?? "",
  ].join("|");
  const [prevPriceSyncKey, setPrevPriceSyncKey] = useState(priceSyncKey);
  if (priceSyncKey !== prevPriceSyncKey) {
    setPrevPriceSyncKey(priceSyncKey);
    const mode = cost?.vk_input_mode ?? "brutto";
    setVkMode(mode);
    setPriceEur(
      accessory != null
        ? centsToEurString(
            mode === "netto"
              ? grossToNetCents(accessory.price_adjustment_cents)
              : accessory.price_adjustment_cents,
          )
        : "0",
    );
    setPurchaseNetEur(
      cost?.purchase_price_net_cents != null
        ? centsToEurString(cost.purchase_price_net_cents)
        : "",
    );
  }

  const priceEnteredCents = eurStringToCents(priceEur);
  const priceGrossCents =
    priceEnteredCents == null
      ? null
      : vkMode === "netto"
        ? netToGrossCents(priceEnteredCents)
        : priceEnteredCents;
  const ekNetCents = eurStringToCents(purchaseNetEur);
  const liveMargin = marginCents(priceGrossCents, ekNetCents);
  const liveMarginPct = marginPercent(priceGrossCents, ekNetCents);

  return (
    <>
      {accessoryCreated ? (
        <SuccessChoiceDialog
          open
          title="Erfolgreich gespeichert"
          description="Das neue Zubehör wurde angelegt. Wie möchten Sie fortfahren?"
          overviewLabel="Zur Übersicht"
          continueLabel="Weiter bearbeiten"
          overviewHref="/admin/accessories"
          continueHref={`/admin/accessories/${accessoryCreated.accessoryId}`}
        />
      ) : null}
      <form
        action={formAction}
        className="max-w-xl space-y-4"
      >
      {accessory?.id ? <input type="hidden" name="id" value={accessory.id} /> : null}

      {state?.ok === false ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true && state.warning ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {state.warning}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Name *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={accessory?.name ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="brand">
            Marke
          </label>
          <input
            id="brand"
            name="brand"
            defaultValue={accessory?.brand ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="article_number"
          >
            Artikelnummer
          </label>
          <input
            id="article_number"
            name="article_number"
            defaultValue={accessory?.article_number ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={accessory?.description ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="category_id">
          Kategorie
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={accessory?.category_id ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">— keine Kategorie —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Preiseingabe</legend>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="vk_input_mode"
              value="brutto"
              checked={vkMode === "brutto"}
              onChange={() => switchVkMode("brutto")}
            />
            Brutto (inkl. 19 % MwSt.)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="vk_input_mode"
              value="netto"
              checked={vkMode === "netto"}
              onChange={() => switchVkMode("netto")}
            />
            Netto (zzgl. MwSt.)
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Gespeichert und im Shop angezeigt wird immer der Brutto-Preis.
        </p>
      </fieldset>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="price_adjustment_eur"
        >
          Preisaufschlag (EUR, {vkMode})
        </label>
        <input
          id="price_adjustment_eur"
          name="price_adjustment_eur"
          type="number"
          step="0.01"
          value={priceEur}
          onChange={(e) => setPriceEur(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
        {priceEnteredCents != null && priceEnteredCents !== 0 ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {vkMode === "brutto"
              ? `= ${formatEurFromCents(grossToNetCents(priceEnteredCents))} netto`
              : `wird gespeichert als ${formatEurFromCents(netToGrossCents(priceEnteredCents))} brutto (inkl. 19 % MwSt.)`}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="purchase_net_eur"
        >
          Einkaufspreis netto (EUR)
        </label>
        <input
          id="purchase_net_eur"
          name="purchase_net_eur"
          type="number"
          step="0.01"
          min="0"
          value={purchaseNetEur}
          onChange={(e) => setPurchaseNetEur(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Nur intern für Admins sichtbar — erscheint nie im Shop.
        </p>
        <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Marge:{" "}
          {liveMargin != null
            ? `${formatEurFromCents(liveMargin)}${
                liveMarginPct != null
                  ? ` (${liveMarginPct.toFixed(1).replace(".", ",")} %)`
                  : ""
              }`
            : "—"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={accessory?.active ?? true}
          className="rounded border-zinc-300"
        />
        <label htmlFor="active" className="text-sm">
          Aktiv
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="image">
          Bild {accessory ? "(optional ersetzen)" : ""}
        </label>
        <input id="image" name="image" type="file" accept="image/*" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Speichern…" : "Speichern"}
      </button>
    </form>
    </>
  );
}
