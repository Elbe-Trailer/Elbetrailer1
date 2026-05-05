"use client";

import { useState } from "react";
import CalendarBlockForm from "./CalendarBlockForm";
import MonthlyAvailabilityCalendar from "./MonthlyAvailabilityCalendar";

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
  rentalUnitId: string;
  blocks: Block[];
  bookings: Booking[];
};

export default function RentalCalendarManager({
  rentalUnitId,
  blocks,
  bookings,
}: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSelectDate(date: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate("");
      return;
    }

    if (date < startDate) {
      setEndDate(startDate);
      setStartDate(date);
      return;
    }

    setEndDate(date);
  }

  return (
    <div className="space-y-6">
      <CalendarBlockForm
        rentalUnitId={rentalUnitId}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />
      <div>
        <h3 className="font-medium text-zinc-900 dark:text-white">Monatsansicht</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Grün = frei, Rot = belegt (inkl. Blockierungen und Buchungen). Klick auf
          einen Tag setzt „Von“, der zweite Klick setzt „Bis“.
        </p>
        <div className="mt-3">
          <MonthlyAvailabilityCalendar
            blocks={blocks}
            bookings={bookings}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onSelectDate={handleSelectDate}
          />
        </div>
      </div>
    </div>
  );
}
