"use client";

import { useActionState } from "react";
import { createRentalUnit, type RentalFormActionState } from "./actions";

type ListingOption = {
  id: string;
  title: string;
};

type Props = {
  listings: ListingOption[];
};

export default function RentalUnitCreateForm({ listings }: Props) {
  const [state, formAction, pending] = useActionState<
    RentalFormActionState,
    FormData
  >(createRentalUnit, undefined);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <label
          htmlFor="listing_id"
          className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          Inserat *
        </label>
        <select
          id="listing_id"
          name="listing_id"
          required
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">Bitte wählen</option>
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="min_rental_days"
          className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
        >
          Mindestmietdauer (Tage)
        </label>
        <input
          id="min_rental_days"
          name="min_rental_days"
          type="number"
          min={1}
          defaultValue={1}
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="active" defaultChecked />
        Aktiv
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Mietobjekt anlegen
        </button>
      </div>
    </form>
  );
}
