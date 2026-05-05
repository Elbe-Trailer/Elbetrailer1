"use client";

import { useActionState, useCallback, useState } from "react";
import { submitInquiry, type SubmitInquiryState } from "./actions";
import Configurator, { type ConfiguratorAccessory } from "./Configurator";

type Props = {
  listingId: string;
  accessories: ConfiguratorAccessory[];
  basePriceCents: number | null;
  baseDailyCents: number | null;
  customerMode: "kauf" | "miete";
  rentalUnitId: string | null;
  minRentalDays: number;
  unavailableRanges: Array<{ start_date: string; end_date: string }>;
};

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function toIsoDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function InquiryForm({
  listingId,
  accessories,
  basePriceCents,
  baseDailyCents,
  customerMode,
  rentalUnitId,
  minRentalDays,
  unavailableRanges,
}: Props) {
  const [selections, setSelections] = useState("[]");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateError, setDateError] = useState<string | null>(null);
  const onSel = useCallback((json: string) => {
    setSelections(json);
  }, []);

  const [state, formAction, pending] = useActionState<
    SubmitInquiryState | undefined,
    FormData
  >(submitInquiry, undefined);

  const onDateChange = useCallback(
    (nextStartDate: string, nextEndDate: string) => {
      setDateError(null);
      if (!nextStartDate || !nextEndDate) return;
      if (nextStartDate > nextEndDate) {
        setDateError("Enddatum muss nach dem Startdatum liegen.");
        return;
      }
      const millisPerDay = 1000 * 60 * 60 * 24;
      const diffDays =
        Math.floor(
          (new Date(`${nextEndDate}T00:00:00Z`).getTime() -
            new Date(`${nextStartDate}T00:00:00Z`).getTime()) /
            millisPerDay,
        ) + 1;
      if (diffDays < minRentalDays) {
        setDateError(`Mindestens ${minRentalDays} Miettag(e) erforderlich.`);
        return;
      }
      const hasConflict = unavailableRanges.some((range) =>
        rangesOverlap(
          nextStartDate,
          nextEndDate,
          range.start_date,
          range.end_date,
        ),
      );
      if (hasConflict) {
        setDateError("Der gewählte Zeitraum ist nicht verfügbar.");
      }
    },
    [minRentalDays, unavailableRanges],
  );

  const handleDateSelect = useCallback(
    (date: string) => {
      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate("");
        onDateChange(date, "");
        return;
      }

      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
        onDateChange(date, startDate);
        return;
      }

      setEndDate(date);
      onDateChange(startDate, date);
    },
    [endDate, onDateChange, startDate],
  );

  const occupiedDayKeys = useCallback(
    (visibleMonth: Date) => {
      const monthStart = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        1,
      );
      const monthEnd = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        0,
      );
      const occupied = new Set<string>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const range of unavailableRanges) {
        let current = parseIsoDate(range.start_date);
        const end = parseIsoDate(range.end_date);
        if (end < monthStart || current > monthEnd) continue;
        if (current < monthStart) current = monthStart;

        while (current <= end && current <= monthEnd) {
          occupied.add(toIsoDateKey(current));
          current = addDays(current, 1);
        }
      }

      // Vergangene Tage gelten immer als belegt.
      let cursor = new Date(monthStart);
      while (cursor < today && cursor <= monthEnd) {
        occupied.add(toIsoDateKey(cursor));
        cursor = addDays(cursor, 1);
      }

      return occupied;
    },
    [unavailableRanges],
  );

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        <p className="font-medium">Vielen Dank — Ihre Anfrage wurde versendet.</p>
        <p className="mt-2 text-sm">Wir melden uns schnellstmöglich bei Ihnen.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="accessory_selections" value={selections} />
      <input type="hidden" name="rental_unit_id" value={rentalUnitId ?? ""} />
      <input type="hidden" name="customer_ansicht" value={customerMode} />

      <Configurator
        accessories={accessories}
        basePriceCents={basePriceCents}
        baseDailyCents={baseDailyCents}
        customerMode={customerMode}
        onSelectionsChange={onSel}
        rentalStartDate={startDate}
        rentalEndDate={endDate}
        hasDateError={!!dateError}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Kontakt
        </h3>
        {state && !state.ok ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        {dateError ? (
          <p className="text-sm text-red-600" role="alert">
            {dateError}
          </p>
        ) : null}
        {customerMode === "miete" && rentalUnitId ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="start_date"
                >
                  Mietbeginn *
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => {
                    const next = event.target.value;
                    setStartDate(next);
                    onDateChange(next, endDate);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="end_date"
                >
                  Mietende *
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(event) => {
                    const next = event.target.value;
                    setEndDate(next);
                    onDateChange(startDate, next);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                />
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                Erster Klick setzt den Mietbeginn, zweiter Klick das Mietende.
              </p>
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() - 1, 1),
                    )
                  }
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  ← Vorheriger Monat
                </button>
                <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-white">
                  {monthLabel(monthCursor)}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setMonthCursor(
                      (current) =>
                        new Date(current.getFullYear(), current.getMonth() + 1, 1),
                    )
                  }
                  className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Nächster Monat →
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDayOfMonth = new Date(
                    monthCursor.getFullYear(),
                    monthCursor.getMonth(),
                    1,
                  );
                  const daysInMonth = new Date(
                    monthCursor.getFullYear(),
                    monthCursor.getMonth() + 1,
                    0,
                  ).getDate();
                  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
                  const occupied = occupiedDayKeys(monthCursor);
                  const rangeStart =
                    startDate && endDate
                      ? (startDate < endDate ? startDate : endDate)
                      : startDate;
                  const rangeEnd =
                    startDate && endDate
                      ? (startDate > endDate ? startDate : endDate)
                      : endDate;

                  const cells: Array<{
                    key: string;
                    day?: number;
                    isOccupied?: boolean;
                  }> = [];

                  for (let i = 0; i < firstWeekday; i += 1) {
                    cells.push({ key: `empty-${i}` });
                  }

                  for (let day = 1; day <= daysInMonth; day += 1) {
                    const current = new Date(
                      monthCursor.getFullYear(),
                      monthCursor.getMonth(),
                      day,
                    );
                    const key = toIsoDateKey(current);
                    cells.push({
                      key,
                      day,
                      isOccupied: occupied.has(key),
                    });
                  }

                  return cells.map((cell) =>
                    cell.day ? (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => handleDateSelect(cell.key)}
                        className={[
                          "flex h-10 w-full items-center justify-center rounded text-sm font-medium",
                          cell.isOccupied
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
                          rangeStart &&
                          rangeEnd &&
                          cell.key >= rangeStart &&
                          cell.key <= rangeEnd
                            ? "ring-2 ring-blue-700 dark:ring-blue-300"
                            : "ring-0",
                          cell.key === startDate || cell.key === endDate
                            ? "outline outline-2 outline-offset-[-2px] outline-zinc-900 dark:outline-zinc-100"
                            : "",
                        ].join(" ")}
                        title={cell.isOccupied ? "Belegt" : "Frei"}
                      >
                        {cell.day}
                      </button>
                    ) : (
                      <div
                        key={cell.key}
                        className="h-10 rounded bg-transparent"
                        aria-hidden
                      />
                    ),
                  );
                })()}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800" />
                  Frei
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-red-200 dark:bg-red-800" />
                  Belegt
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded ring-2 ring-blue-700 dark:ring-blue-300" />
                  Ausgewählter Zeitraum
                </span>
              </div>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="name"
            >
              Name *
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="email"
            >
              E-Mail *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="phone"
          >
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            htmlFor="message"
          >
            Nachricht
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="Wunschzeitraum, Abholort, Fragen …"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !!dateError}
          className="rounded-lg bg-amber-600 px-5 py-2.5 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Wird gesendet…" : "Unverbindliche Anfrage senden"}
        </button>
      </div>
    </form>
  );
}
