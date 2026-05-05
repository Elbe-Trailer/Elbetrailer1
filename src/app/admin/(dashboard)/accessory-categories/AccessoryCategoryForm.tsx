"use client";

import { useActionState } from "react";
import type { AccessoryCategory } from "@/types/database";
import {
  deleteAccessoryCategory,
  saveAccessoryCategory,
  type SaveAccessoryCategoryState,
} from "./actions";

type Props = { category?: AccessoryCategory };

export default function AccessoryCategoryForm({ category }: Props) {
  const [state, formAction, pending] = useActionState<
    SaveAccessoryCategoryState,
    FormData
  >(saveAccessoryCategory, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      {category?.id ? <input type="hidden" name="id" value={category.id} /> : null}

      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950/50">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium" htmlFor="name">
          Name *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={category?.name ?? ""}
          className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" htmlFor="sort_order">
          Sortierung
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={category?.sort_order ?? 0}
          className="w-32 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={category?.is_active ?? true}
        />
        <label htmlFor="is_active" className="text-sm">
          Aktiv
        </label>
      </div>

      <fieldset className="rounded border border-zinc-200 p-3 dark:border-zinc-700">
        <legend className="text-sm font-medium">Auswahl für Kunden</legend>
        <p className="mb-2 mt-1 text-xs text-zinc-500">
          Im Admin können Sie einem Inserat weiterhin beliebig viele Artikel dieser
          Kategorie zuordnen. Die folgende Einstellung gilt nur für Interessenten auf
          der öffentlichen Seite (Preiskalkulation und Anfrage).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="allows_multiple"
              value="true"
              defaultChecked={(category?.allows_multiple ?? true) !== false}
            />
            Mehrfachauswahl
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="allows_multiple"
              value="false"
              defaultChecked={category?.allows_multiple === false}
            />
            Nur eine Option für Kunden (Einzelauswahl im Konfigurator)
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900"
        >
          Speichern
        </button>
        {category?.id ? (
          <button
            type="submit"
            formAction={deleteAccessoryCategory}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
            onClick={(event) => {
              if (!confirm("Kategorie wirklich löschen?")) {
                event.preventDefault();
              }
            }}
          >
            Löschen
          </button>
        ) : null}
      </div>
    </form>
  );
}
