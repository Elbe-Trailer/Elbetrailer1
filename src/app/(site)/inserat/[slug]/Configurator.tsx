"use client";

import { useEffect, useMemo, useState } from "react";
import StorageImage from "@/components/StorageImage";
import { formatEurFromCents } from "@/lib/format";
import { calculateRentalPrice } from "@/lib/rentalPricing";
import type { Accessory, AccessorySelection } from "@/types/database";

export type ConfiguratorAccessory = Accessory & {
  max_quantity: number;
  /** false: höchstens ein aktives Zubehör in dieser Kategorie (Rest wird abgewählt). */
  category_allows_multiple: boolean;
  category_sort_order: number;
  category_display_name: string;
};

type Props = {
  accessories: ConfiguratorAccessory[];
  basePriceCents: number | null;
  baseDailyCents: number | null;
  customerMode: "kauf" | "miete";
  onSelectionsChange: (json: string) => void;
  initialSelections?: AccessorySelection[];
  rentalStartDate?: string;
  rentalEndDate?: string;
  hasDateError?: boolean;
  discountTiers?: Array<{ min_days: number; discount_percent: number }>;
};

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export default function Configurator({
  accessories,
  basePriceCents,
  baseDailyCents,
  customerMode,
  onSelectionsChange,
  initialSelections = [],
  rentalStartDate = "",
  rentalEndDate = "",
  hasDateError = false,
  discountTiers = [],
}: Props) {
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const entries = initialSelections
      .filter((selection) => selection.quantity > 0)
      .map((selection) => [selection.accessory_id, selection.quantity] as const);
    return Object.fromEntries(entries);
  });

  const groups = useMemo(() => {
    type G = {
      key: string;
      sort: number;
      label: string;
      items: ConfiguratorAccessory[];
    };
    const map = new Map<string, G>();
    for (const a of accessories) {
      const key = a.category_id ?? "__none__";
      if (!map.has(key)) {
        map.set(key, {
          key,
          sort: a.category_sort_order,
          label: a.category_display_name,
          items: [],
        });
      }
      map.get(key)!.items.push(a);
    }
    for (const g of map.values()) {
      g.items.sort((x, y) => x.name.localeCompare(y.name, "de"));
    }
    return [...map.values()].sort((x, y) => x.sort - y.sort || x.label.localeCompare(y.label, "de"));
  }, [accessories]);

  const lines = useMemo(() => {
    return accessories.map((a) => ({
      accessory: a,
      q: Math.min(
        qty[a.id] ?? 0,
        a.max_quantity,
      ),
    }));
  }, [accessories, qty]);

  const accessoryTotal = useMemo(() => {
    return lines.reduce(
      (sum, { accessory: a, q }) => sum + (q > 0 ? a.price_adjustment_cents * q : 0),
      0,
    );
  }, [lines]);

  const isRental = customerMode === "miete";
  const base = isRental ? baseDailyCents ?? 0 : basePriceCents ?? 0;
  const grand = base + accessoryTotal;
  const hasRentalRange =
    isRental &&
    rentalStartDate !== "" &&
    rentalEndDate !== "" &&
    rentalStartDate <= rentalEndDate &&
    !hasDateError;
  const rentalDays = hasRentalRange
    ? Math.floor(
        (new Date(`${rentalEndDate}T00:00:00Z`).getTime() -
          new Date(`${rentalStartDate}T00:00:00Z`).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 0;
  const rentalPrice = useMemo(
    () =>
      calculateRentalPrice(grand, rentalDays, discountTiers),
    [discountTiers, grand, rentalDays],
  );
  const normalizedDiscountTiers = useMemo(
    () =>
      (discountTiers ?? [])
        .filter(
          (tier) =>
            Number.isFinite(Number(tier.min_days)) &&
            Number(tier.min_days) >= 2 &&
            Number.isFinite(Number(tier.discount_percent)) &&
            Number(tier.discount_percent) > 0,
        )
        .map((tier) => ({
          min_days: Math.floor(Number(tier.min_days)),
          discount_percent: Math.floor(Number(tier.discount_percent)),
        }))
        .sort((a, b) => a.min_days - b.min_days),
    [discountTiers],
  );
  const activeDiscountTier = useMemo(() => {
    if (!isRental || rentalDays <= 0) return null;
    const applicable = normalizedDiscountTiers.filter((tier) => rentalDays >= tier.min_days);
    if (applicable.length === 0) return null;
    return applicable[applicable.length - 1];
  }, [isRental, normalizedDiscountTiers, rentalDays]);

  useEffect(() => {
    const selections = accessories
      .map((a) => ({
        accessory_id: a.id,
        quantity: Math.min(qty[a.id] ?? 0, a.max_quantity),
      }))
      .filter((s) => s.quantity > 0);
    onSelectionsChange(JSON.stringify(selections));
  }, [accessories, onSelectionsChange, qty]);

  function setQuantity(id: string, value: number, max: number) {
    const v = Math.max(0, Math.min(max, value));
    setQty((prev) => {
      const acc = accessories.find((x) => x.id === id);
      const next: Record<string, number> = { ...prev };
      if (
        acc &&
        acc.category_id &&
        !acc.category_allows_multiple &&
        v > 0
      ) {
        for (const a of accessories) {
          if (a.category_id === acc.category_id && a.id !== id) {
            next[a.id] = 0;
          }
        }
      }
      next[id] = v;
      return next;
    });
  }

  if (accessories.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Für dieses Inserat ist kein konfigurierbares Zubehör hinterlegt.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {group.label}
              {group.items.length > 0 &&
              !group.items[0].category_allows_multiple ? (
                <span className="ml-2 font-normal normal-case text-zinc-400">
                  (Einzelauswahl)
                </span>
              ) : null}
            </p>
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
              {group.items.map((a) => {
                const q = qty[a.id] ?? 0;
                const isSelected = q > 0;
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-3">
                      {a.image_path ? (
                        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <StorageImage
                            bucket="accessories"
                            path={a.image_path}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      ) : null}
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {a.name}
                        </p>
                        {a.brand || a.article_number ? (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {[a.brand, a.article_number ? `Art.-Nr. ${a.article_number}` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                        {a.description ? (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {a.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                          {isRental
                            ? `${formatEurFromCents(a.price_adjustment_cents)} / Tag`
                            : `${formatEurFromCents(a.price_adjustment_cents)} je Stück`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(
                            a.id,
                            isSelected ? 0 : Math.max(1, q),
                            a.max_quantity,
                          )
                        }
                        className={`rounded-lg border px-3 py-1 text-sm transition ${
                          isSelected
                            ? "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300"
                            : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                        }`}
                      >
                        {isSelected ? "ausgewählt" : "auswählen"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
        <div className="flex justify-between">
          <span>
            {isRental ? "Basis (pro Tag)" : "Basispreis"}
          </span>
          <span>{formatEurFromCents(isRental ? baseDailyCents : basePriceCents)}</span>
        </div>
        <div className="mt-1 flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{isRental ? "Zubehör (pro Tag)" : "Zubehör"}</span>
          <span>{formatEurFromCents(accessoryTotal)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-zinc-300 pt-3 font-semibold dark:border-zinc-600">
          <span>{isRental ? "Richtwert gesamt (pro Tag)" : "Richtwert gesamt"}</span>
          <span>{formatEurFromCents(grand)}</span>
        </div>
        {hasRentalRange ? (
          <>
            <div className="mt-2 flex justify-between text-zinc-600 dark:text-zinc-300">
              <span>Rabattstufe</span>
              <span>
                {activeDiscountTier
                  ? `${activeDiscountTier.discount_percent}% ab ${activeDiscountTier.min_days} Tagen`
                  : "Keine"}
              </span>
            </div>
            {rentalPrice.discountPercentApplied > 0 ? (
              <>
                <div className="mt-2 flex justify-between text-zinc-700 dark:text-zinc-200">
                  <span>
                    Gesamtpreis ({formatDateLabel(rentalStartDate)} -{" "}
                    {formatDateLabel(rentalEndDate)})
                  </span>
                  <span>{formatEurFromCents(rentalPrice.grossTotalCents)}</span>
                </div>
                <div className="mt-1 flex justify-between text-emerald-700 dark:text-emerald-300">
                  <span>Rabatt ({rentalPrice.discountPercentApplied}%)</span>
                  <span>-{formatEurFromCents(rentalPrice.discountAmountCents)}</span>
                </div>
              </>
            ) : null}
            <div className="mt-1 flex justify-between text-zinc-700 dark:text-zinc-200">
              <span className="font-semibold">
                Endpreis ({formatDateLabel(rentalStartDate)} -{" "}
                {formatDateLabel(rentalEndDate)})
              </span>
              <span className="font-semibold">
                {formatEurFromCents(rentalPrice.finalTotalCents)}
              </span>
            </div>
          </>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          Unverbindliche Übersicht — verbindliche Preise erhalten Sie mit
          unserem Angebot.
        </p>
        {isRental && normalizedDiscountTiers.length > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            Langzeit-Rabattstaffel:{" "}
            {normalizedDiscountTiers
              .map((tier) => `ab ${tier.min_days} Tagen ${tier.discount_percent}%`)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
