"use client";

import { useActionState, useMemo, useState } from "react";
import {
  type RentalFormActionState,
  updateGlobalRentalDiscount,
} from "./actions";

type Props = {
  tiers: Array<{ min_days: number; discount_percent: number }>;
};

export default function GlobalRentalDiscountForm({ tiers }: Props) {
  const initialRows = useMemo(
    () =>
      tiers.length > 0
        ? tiers.map((tier) => ({
            id: crypto.randomUUID(),
            min_days: tier.min_days,
            discount_percent: tier.discount_percent,
          }))
        : [{ id: crypto.randomUUID(), min_days: 7, discount_percent: 5 }],
    [tiers],
  );
  const [rows, setRows] = useState(initialRows);
  const [state, formAction, pending] = useActionState<
    RentalFormActionState,
    FormData
  >(updateGlobalRentalDiscount, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Rabattierung gespeichert.
        </p>
      ) : null}
      <div className="grid gap-2 text-xs font-medium text-zinc-500 sm:grid-cols-[1fr_1fr_auto]">
        <span>Ab wie vielen Tagen</span>
        <span>Rabatt in Prozent</span>
        <span className="text-right">Aktion</span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              name="tier_min_days"
              type="number"
              min={2}
              defaultValue={row.min_days}
              placeholder="ab Tage"
              aria-label="Ab wie vielen Tagen"
              className="rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
            <div className="relative">
              <input
                name="tier_discount_percent"
                type="number"
                min={1}
                max={100}
                defaultValue={row.discount_percent}
                placeholder="Rabatt %"
                aria-label="Rabatt in Prozent"
                className="w-full rounded border border-zinc-300 px-2 py-2 pr-7 dark:border-zinc-600 dark:bg-zinc-950"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                %
              </span>
            </div>
            <button
              type="button"
              className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
              onClick={() =>
                setRows((prev) =>
                  prev.length <= 1 ? prev : prev.filter((item) => item.id !== row.id),
                )
              }
            >
              Entfernen
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { id: crypto.randomUUID(), min_days: 14, discount_percent: 10 },
            ])
          }
        >
          Stufe hinzufügen
        </button>
        <span className="text-xs text-zinc-500">
          Es gilt automatisch die höchste passende Stufe.
        </span>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
        >
          Globale Rabattierung speichern
        </button>
      </div>
    </form>
  );
}
