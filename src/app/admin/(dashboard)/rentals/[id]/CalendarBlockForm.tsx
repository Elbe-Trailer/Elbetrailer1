"use client";

import { useActionState, useEffect, useState } from "react";
import { addCalendarBlock, type RentalFormActionState } from "../actions";

type Props = {
  rentalUnitId: string;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
};

export default function CalendarBlockForm({
  rentalUnitId,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const [state, formAction, pending] = useActionState<
    RentalFormActionState,
    FormData
  >(addCalendarBlock, undefined);
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  useEffect(() => {
    if (typeof startDate === "string") setLocalStartDate(startDate);
  }, [startDate]);

  useEffect(() => {
    if (typeof endDate === "string") setLocalEndDate(endDate);
  }, [endDate]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="rental_unit_id" value={rentalUnitId} />
      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p
          className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 sm:col-span-2"
          role="status"
        >
          Erfolgreich gespeichert.
        </p>
      ) : null}
      <div>
        <label htmlFor="start_date" className="mb-1 block text-xs font-medium">
          Von *
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          required
          value={localStartDate}
          onChange={(event) => {
            const value = event.target.value;
            setLocalStartDate(value);
            onStartDateChange?.(value);
          }}
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="end_date" className="mb-1 block text-xs font-medium">
          Bis *
        </label>
        <input
          id="end_date"
          name="end_date"
          type="date"
          required
          value={localEndDate}
          onChange={(event) => {
            const value = event.target.value;
            setLocalEndDate(value);
            onEndDateChange?.(value);
          }}
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="reason" className="mb-1 block text-xs font-medium">
          Grund (optional)
        </label>
        <input
          id="reason"
          name="reason"
          className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="z. B. Wartung / intern reserviert"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Zeitraum blockieren
        </button>
      </div>
    </form>
  );
}
