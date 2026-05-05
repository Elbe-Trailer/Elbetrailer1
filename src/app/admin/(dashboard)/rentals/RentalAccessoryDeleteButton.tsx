"use client";

import { deleteRentalAccessory } from "./actions";

export default function RentalAccessoryDeleteButton() {
  return (
    <button
      type="submit"
      formAction={deleteRentalAccessory}
      className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
      onClick={(event) => {
        if (!confirm("Miet-Zubehör wirklich löschen?")) {
          event.preventDefault();
        }
      }}
    >
      Löschen
    </button>
  );
}
