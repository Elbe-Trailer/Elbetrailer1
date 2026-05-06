"use client";

import { useMemo, useState } from "react";

type Block = {
  id: string;
  start_date: string;
  end_date: string;
};

type Booking = {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
};

type Props = {
  blocks: Block[];
  bookings: Booking[];
  selectedStartDate?: string;
  selectedEndDate?: string;
  onSelectDate?: (date: string) => void;
};

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

export default function MonthlyAvailabilityCalendar({
  blocks,
  bookings,
  selectedStartDate,
  selectedEndDate,
  onSelectDate,
}: Props) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const occupiedDayKeys = useMemo(() => {
    const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const occupied = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ranges = [
      ...blocks.map((block) => [block.start_date, block.end_date] as const),
      ...bookings
        .filter((booking) => booking.status === "confirmed")
        .map((booking) => [booking.start_date, booking.end_date] as const),
    ];

    for (const [startDate, endDate] of ranges) {
      let current = parseIsoDate(startDate);
      const end = parseIsoDate(endDate);
      if (end < monthStart || current > monthEnd) continue;
      if (current < monthStart) current = monthStart;

      while (current <= end && current <= monthEnd) {
        occupied.add(toIsoDateKey(current));
        current = addDays(current, 1);
      }
    }

    // Vergangene Tage sind grundsätzlich nicht mehr buchbar.
    let cursor = new Date(monthStart);
    while (cursor < today && cursor <= monthEnd) {
      occupied.add(toIsoDateKey(cursor));
      cursor = addDays(cursor, 1);
    }

    return occupied;
  }, [blocks, bookings, monthCursor]);

  const dayCells = useMemo(() => {
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
    const cells: Array<{ key: string; day?: number; occupied?: boolean }> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
      const key = toIsoDateKey(current);
      cells.push({
        key,
        day,
        occupied: occupiedDayKeys.has(key),
      });
    }

    return cells;
  }, [monthCursor, occupiedDayKeys]);

  const rangeStart =
    selectedStartDate && selectedEndDate
      ? (selectedStartDate < selectedEndDate
          ? selectedStartDate
          : selectedEndDate)
      : selectedStartDate || "";
  const rangeEnd =
    selectedStartDate && selectedEndDate
      ? (selectedStartDate > selectedEndDate
          ? selectedStartDate
          : selectedEndDate)
      : selectedEndDate || "";

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setMonthCursor(
              (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
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
              (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
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
        {dayCells.map((cell) =>
          cell.day ? (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate?.(cell.key)}
              className={[
                "flex h-10 w-full items-center justify-center rounded text-sm font-medium",
                cell.occupied
                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
                rangeStart && rangeEnd && cell.key >= rangeStart && cell.key <= rangeEnd
                  ? "ring-2 ring-blue-700 dark:ring-blue-300"
                  : "ring-0",
                cell.key === selectedStartDate || cell.key === selectedEndDate
                  ? "outline outline-2 outline-offset-[-2px] outline-zinc-900 dark:outline-zinc-100"
                  : "",
              ].join(" ")}
              title={cell.occupied ? "Belegt" : "Frei"}
            >
              {cell.day}
            </button>
          ) : (
            <div key={cell.key} className="h-10 rounded bg-transparent" aria-hidden />
          ),
        )}
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
  );
}
