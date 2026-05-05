"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  AccessoryForListingConfig,
  Category,
  Listing,
  ListingType,
} from "@/types/database";
import SuccessChoiceDialog from "@/components/admin/SuccessChoiceDialog";
import { saveListing, type SaveListingState } from "./actions";

type LaRow = { accessory_id: string; max_quantity: number };

function accessoryDisplayName(a: AccessoryForListingConfig) {
  const bits: string[] = [];
  if (a.brand) bits.push(a.brand);
  if (a.article_number) bits.push(`Art.-Nr. ${a.article_number}`);
  if (!bits.length) return a.name;
  return `${a.name} (${bits.join(" · ")})`;
}

function accessoryGroups(accessories: AccessoryForListingConfig[]) {
  type Group = {
    key: string;
    label: string;
    sort: number;
    allowsMultiple: boolean;
    items: AccessoryForListingConfig[];
  };
  const map = new Map<string, Group>();
  for (const a of accessories) {
    const key = a.category_id ?? "__none__";
    const c = a.accessory_categories;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: c?.name ?? "Ohne Kategorie",
        sort: c?.sort_order ?? 10_000,
        allowsMultiple: c?.allows_multiple !== false,
        items: [],
      });
    }
    map.get(key)!.items.push(a);
  }
  for (const g of map.values()) {
    g.items.sort((x, y) => x.name.localeCompare(y.name, "de"));
  }
  return [...map.values()].sort((x, y) => x.sort - y.sort || x.label.localeCompare(y.label, "de"));
}

type Props = {
  listing?: Listing;
  linked?: LaRow[];
  categories: Pick<Category, "id" | "name">[];
  accessories: AccessoryForListingConfig[];
};

export default function ListingForm({
  listing,
  linked = [],
  categories,
  accessories,
}: Props) {
  const initialType = (listing?.listing_type as ListingType | undefined) ?? "kauf";
  const [offerKauf, setOfferKauf] = useState(
    () => initialType !== "miete",
  );
  const [offerMiete, setOfferMiete] = useState(
    () => initialType !== "kauf",
  );
  const [state, formAction, pending] = useActionState<
    SaveListingState,
    FormData
  >(saveListing, undefined);

  const listingCreated =
    state?.ok === true && state.created === true ? state : null;

  const linkMap = new Map(linked.map((r) => [r.accessory_id, r.max_quantity]));

  const groups = useMemo(() => accessoryGroups(accessories), [accessories]);

  return (
    <>
      {listingCreated ? (
        <SuccessChoiceDialog
          open
          title="Erfolgreich gespeichert"
          description="Das neue Inserat wurde angelegt. Wie möchten Sie fortfahren?"
          overviewLabel="Zur Übersicht"
          continueLabel="Weiter bearbeiten"
          overviewHref="/admin/listings"
          continueHref={`/admin/listings/${listingCreated.listingId}`}
        />
      ) : null}
      <form
        action={formAction}
        className="max-w-3xl space-y-6"
      >
      {listing?.id ? (
        <input type="hidden" name="id" value={listing.id} />
      ) : null}

      {state?.ok === false ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          Titel *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={listing?.title ?? ""}
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
            defaultValue={listing?.brand ?? ""}
            placeholder="z. B. Hersteller"
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
            defaultValue={listing?.article_number ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="category_id">
          Kategorie *
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          defaultValue={listing?.category_id ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">— wählen —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Angebote *</legend>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sie können Kauf und Miete unabhängig voneinander aktivieren.
        </p>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="offer_kauf"
              checked={offerKauf}
              onChange={(e) => setOfferKauf(e.target.checked)}
            />
            Kauf
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="offer_miete"
              checked={offerMiete}
              onChange={(e) => setOfferMiete(e.target.checked)}
            />
            Miete
          </label>
        </div>
      </fieldset>

      {offerKauf ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="price_eur">
            Kaufpreis (EUR) *
          </label>
          <input
            id="price_eur"
            name="price_eur"
            type="number"
            step="0.01"
            min="0"
            required={offerKauf}
            defaultValue={
              listing?.price_cents != null
                ? (listing.price_cents / 100).toFixed(2)
                : ""
            }
            className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      ) : null}

      {offerMiete ? (
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="daily_eur">
            Tagessatz (EUR) *
          </label>
          <input
            id="daily_eur"
            name="daily_eur"
            type="number"
            step="0.01"
            min="0"
            required={offerMiete}
            defaultValue={
              listing?.daily_rate_cents != null
                ? (listing.daily_rate_cents / 100).toFixed(2)
                : ""
            }
            className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={listing?.published ?? false}
          className="rounded border-zinc-300"
        />
        <label htmlFor="published" className="text-sm">
          Veröffentlicht
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={listing?.description ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="condition">
            Zustand
          </label>
          <input
            id="condition"
            name="condition"
            defaultValue={listing?.condition ?? ""}
            placeholder="z. B. neu, gebraucht"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="exterior_length_mm">
            Außenabmessungen Länge (mm)
          </label>
          <input
            id="exterior_length_mm"
            name="exterior_length_mm"
            type="number"
            min="0"
            defaultValue={listing?.exterior_length_mm ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="exterior_width_mm">
            Außenabmessungen Breite (mm)
          </label>
          <input
            id="exterior_width_mm"
            name="exterior_width_mm"
            type="number"
            min="0"
            defaultValue={listing?.exterior_width_mm ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="loading_length_mm">
            Laderaumabmessungen Länge (mm)
          </label>
          <input
            id="loading_length_mm"
            name="loading_length_mm"
            type="number"
            min="0"
            defaultValue={listing?.loading_length_mm ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="loading_width_mm">
            Laderaumabmessungen Breite (mm)
          </label>
          <input
            id="loading_width_mm"
            name="loading_width_mm"
            type="number"
            min="0"
            defaultValue={listing?.loading_width_mm ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="gross_weight_kg">
            Zulässiges Gesamtgewicht (kg)
          </label>
          <input
            id="gross_weight_kg"
            name="gross_weight_kg"
            type="number"
            min="0"
            defaultValue={listing?.gross_weight_kg ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="payload_kg">
            Nutzlast (kg)
          </label>
          <input
            id="payload_kg"
            name="payload_kg"
            type="number"
            min="0"
            defaultValue={listing?.payload_kg ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="empty_weight_kg">
            Eigengewicht (kg)
          </label>
          <input
            id="empty_weight_kg"
            name="empty_weight_kg"
            type="number"
            min="0"
            defaultValue={listing?.empty_weight_kg ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="tire_size_inch">
            Bereifung (Zoll)
          </label>
          <input
            id="tire_size_inch"
            name="tire_size_inch"
            type="number"
            step="0.1"
            min="0"
            defaultValue={listing?.tire_size_inch ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="axle_count">
            Achsen
          </label>
          <input
            id="axle_count"
            name="axle_count"
            type="number"
            min="0"
            defaultValue={listing?.axle_count ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="braked">
            Gebremst
          </label>
          <select
            id="braked"
            name="braked"
            defaultValue={
              listing?.braked == null ? "" : listing.braked ? "yes" : "no"
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">— wählen —</option>
            <option value="yes">Ja</option>
            <option value="no">Nein</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="tip_function">
            Kipfunktion
          </label>
          <input
            id="tip_function"
            name="tip_function"
            defaultValue={listing?.tip_function ?? ""}
            placeholder="z. B. hydraulisch"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="lighting">
            Beleuchtung
          </label>
          <input
            id="lighting"
            name="lighting"
            defaultValue={listing?.lighting ?? ""}
            placeholder="z. B. LED"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="loading_ramps">
            Auffahrrampen
          </label>
          <input
            id="loading_ramps"
            name="loading_ramps"
            defaultValue={listing?.loading_ramps ?? ""}
            placeholder="z. B. inklusive, optional"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="loading_area">
            Ladefläche
          </label>
          <input
            id="loading_area"
            name="loading_area"
            defaultValue={listing?.loading_area ?? ""}
            placeholder="z. B. Siebdruckboden"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Bilder (neu hochladen)</p>
        <input
          name="images"
          type="file"
          accept="image/*"
          multiple
          className="text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Konfigurierbares Zubehör</p>
        <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          {accessories.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Keine Zubehör-Artikel angelegt — unter „Zubehör“ im Admin anlegen.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {group.label}
                  {!group.allowsMultiple ? (
                    <span className="ml-2 font-normal normal-case text-zinc-400">
                      (Kunde wählt im Konfigurator nur eine Option)
                    </span>
                  ) : null}
                </p>
                <ul className="space-y-2">
                  {group.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center gap-3"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="accessory"
                          value={a.id}
                          defaultChecked={linkMap.has(a.id)}
                        />
                        {accessoryDisplayName(a)}
                      </label>
                      <label className="flex items-center gap-1 text-xs text-zinc-500">
                        max.
                        <input
                          name={`max_${a.id}`}
                          type="number"
                          min="1"
                          defaultValue={linkMap.get(a.id) ?? 1}
                          className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Speichern…" : "Speichern"}
      </button>
    </form>
    </>
  );
}
