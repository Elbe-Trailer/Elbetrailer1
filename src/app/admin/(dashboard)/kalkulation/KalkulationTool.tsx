"use client";

import { useMemo, useState } from "react";
import MarginTable, { type MarginLine } from "@/components/admin/MarginTable";
import { formatEurFromCents } from "@/lib/format";
import type { ListingType } from "@/types/database";

export type KalkListing = {
  id: string;
  title: string;
  article_number: string | null;
  price_cents: number | null;
  daily_rate_cents: number | null;
  listing_type: ListingType;
  published: boolean;
  ek_net_cents: number | null;
};

export type KalkAccessory = {
  id: string;
  name: string;
  brand: string | null;
  article_number: string | null;
  price_adjustment_cents: number;
  category_id: string | null;
  category_name: string;
  category_sort: number;
  allows_multiple: boolean;
  ek_net_cents: number | null;
};

export type KalkLink = {
  listing_id: string;
  accessory_id: string;
  max_quantity: number;
};

type Props = {
  listings: KalkListing[];
  accessories: KalkAccessory[];
  links: KalkLink[];
};

function accessoryLabel(a: KalkAccessory): string {
  const bits: string[] = [];
  if (a.brand) bits.push(a.brand);
  if (a.article_number) bits.push(`Art.-Nr. ${a.article_number}`);
  return bits.length ? `${a.name} (${bits.join(" · ")})` : a.name;
}

export default function KalkulationTool({ listings, accessories, links }: Props) {
  const [listingId, setListingId] = useState<string>("");
  const [mode, setMode] = useState<"kauf" | "miete">("kauf");
  const [qty, setQty] = useState<Record<string, number>>({});

  const listing = listings.find((l) => l.id === listingId) ?? null;
  const hasKauf = listing != null && listing.listing_type !== "miete";
  const hasMiete = listing != null && listing.listing_type !== "kauf";
  const effectiveMode: "kauf" | "miete" = !listing
    ? "kauf"
    : hasKauf && mode === "kauf"
      ? "kauf"
      : hasMiete
        ? "miete"
        : "kauf";

  function selectListing(id: string) {
    setListingId(id);
    setQty({});
    const next = listings.find((l) => l.id === id) ?? null;
    setMode(next != null && next.listing_type === "miete" ? "miete" : "kauf");
  }

  const linked = useMemo(() => {
    if (!listing) return [];
    const maxById = new Map(
      links
        .filter((row) => row.listing_id === listing.id)
        .map((row) => [row.accessory_id, row.max_quantity]),
    );
    return accessories
      .filter((a) => maxById.has(a.id))
      .map((a) => ({ accessory: a, max: maxById.get(a.id)! }));
  }, [accessories, links, listing]);

  const groups = useMemo(() => {
    type Group = {
      key: string;
      label: string;
      sort: number;
      allowsMultiple: boolean;
      items: { accessory: KalkAccessory; max: number }[];
    };
    const map = new Map<string, Group>();
    for (const item of linked) {
      const key = item.accessory.category_id ?? "__none__";
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: item.accessory.category_name,
          sort: item.accessory.category_sort,
          allowsMultiple: item.accessory.allows_multiple,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    for (const g of map.values()) {
      g.items.sort((x, y) =>
        x.accessory.name.localeCompare(y.accessory.name, "de"),
      );
    }
    return [...map.values()].sort(
      (x, y) => x.sort - y.sort || x.label.localeCompare(y.label, "de"),
    );
  }, [linked]);

  const baseVkCents =
    effectiveMode === "miete"
      ? (listing?.daily_rate_cents ?? null)
      : (listing?.price_cents ?? null);

  const marginLines = useMemo(() => {
    if (!listing) return [];
    const lines: MarginLine[] = [];
    if (baseVkCents != null) {
      lines.push({
        key: "base",
        label: `Basis: ${listing.title}`,
        sublabel: listing.article_number
          ? `Art.-Nr. ${listing.article_number}`
          : undefined,
        quantity: 1,
        vkGrossCents: baseVkCents,
        ekNetCents: listing.ek_net_cents,
      });
    }
    for (const { accessory } of linked) {
      const q = qty[accessory.id] ?? 0;
      if (q <= 0) continue;
      lines.push({
        key: accessory.id,
        label: accessory.name,
        sublabel: accessory.article_number
          ? `Art.-Nr. ${accessory.article_number}`
          : undefined,
        quantity: q,
        vkGrossCents: accessory.price_adjustment_cents,
        ekNetCents: accessory.ek_net_cents,
      });
    }
    return lines;
  }, [baseVkCents, linked, listing, qty]);

  function setQuantity(id: string, value: number, max: number) {
    const v = Math.max(0, Math.min(max, value));
    setQty((prev) => ({ ...prev, [id]: v }));
  }

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <label className="mb-1 block text-sm font-medium" htmlFor="kalk-listing">
          Inserat
        </label>
        <select
          id="kalk-listing"
          value={listingId}
          onChange={(e) => selectListing(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">— Inserat wählen —</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
              {l.article_number ? ` (Art.-Nr. ${l.article_number})` : ""}
              {l.published ? "" : " — unveröffentlicht"}
            </option>
          ))}
        </select>
      </div>

      {listing && hasKauf && hasMiete ? (
        <div className="flex gap-2">
          {(["kauf", "miete"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${
                effectiveMode === m
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {m === "kauf" ? "Kauf" : "Miete (pro Tag)"}
            </button>
          ))}
        </div>
      ) : null}

      {listing ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <p className="text-sm font-medium">Zubehör</p>
            {groups.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Für dieses Inserat ist kein Zubehör verknüpft.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {group.label}
                    {!group.allowsMultiple ? (
                      <span className="ml-2 font-normal normal-case text-zinc-400">
                        (Kunde wählt nur eine Option)
                      </span>
                    ) : null}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map(({ accessory, max }) => {
                      const q = qty[accessory.id] ?? 0;
                      return (
                        <li
                          key={accessory.id}
                          className="flex flex-wrap items-center gap-3 text-sm"
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={q > 0}
                              onChange={(e) =>
                                setQuantity(
                                  accessory.id,
                                  e.target.checked ? 1 : 0,
                                  max,
                                )
                              }
                            />
                            {accessoryLabel(accessory)}
                          </label>
                          <span className="text-xs text-zinc-500">
                            {formatEurFromCents(accessory.price_adjustment_cents)}
                          </span>
                          {q > 0 && max > 1 ? (
                            <label className="flex items-center gap-1 text-xs text-zinc-500">
                              Menge
                              <input
                                type="number"
                                min={1}
                                max={max}
                                value={q}
                                onChange={(e) =>
                                  setQuantity(
                                    accessory.id,
                                    Number.parseInt(e.target.value, 10) || 0,
                                    max,
                                  )
                                }
                                className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-950"
                              />
                            </label>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div>
            {marginLines.length > 0 ? (
              <MarginTable lines={marginLines} mode={effectiveMode} />
            ) : (
              <p className="text-sm text-zinc-500">
                {effectiveMode === "kauf"
                  ? "Für dieses Inserat ist kein Kaufpreis hinterlegt."
                  : "Für dieses Inserat ist kein Tagessatz hinterlegt."}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Wählen Sie ein Inserat, um die Kalkulation zu starten.
        </p>
      )}
    </div>
  );
}
