"use client";

import { useActionState } from "react";
import { updateRentalUnit, type RentalFormActionState } from "../actions";

type Props = {
  rentalUnitId: string;
  minRentalDays: number;
  active: boolean;
};

export default function RentalUnitSettingsForm({
  rentalUnitId,
  minRentalDays,
  active,
}: Props) {
  const [state, formAction, pending] = useActionState<
    RentalFormActionState,
    FormData
  >(updateRentalUnit, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={rentalUnitId} />
      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
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
          defaultValue={minRentalDays}
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="active" defaultChecked={active} />
        Aktiv
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
        >
          Einstellungen speichern
        </button>
      </div>
    </form>
  );
}
