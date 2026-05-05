"use client";

import { useActionState } from "react";
import { createRentalAccessory, type RentalFormActionState } from "./actions";

export default function RentalAccessoriesManager() {
  const [state, formAction, pending] = useActionState<
    RentalFormActionState,
    FormData
  >(createRentalAccessory, undefined);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p
          className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
          role="status"
        >
          Erfolgreich gespeichert.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-medium">
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label htmlFor="daily_rate_eur" className="mb-1 block text-xs font-medium">
            Tagessatz (EUR) *
          </label>
          <input
            id="daily_rate_eur"
            name="daily_rate_eur"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0.00"
            required
            className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-xs font-medium">
          Beschreibung
        </label>
        <input
          id="description"
          name="description"
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Aktiv
      </label>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Miet-Zubehör anlegen
        </button>
      </div>
    </form>
  );
}
