"use client";

import { useActionState } from "react";
import type { Accessory, AccessoryCategory } from "@/types/database";
import SuccessChoiceDialog from "@/components/admin/SuccessChoiceDialog";
import { saveAccessory, type SaveAccessoryState } from "./actions";

type Props = {
  accessory?: Accessory;
  categories: Pick<AccessoryCategory, "id" | "name">[];
};

export default function AccessoryForm({ accessory, categories }: Props) {
  const [state, formAction, pending] = useActionState<
    SaveAccessoryState,
    FormData
  >(saveAccessory, undefined);

  const accessoryCreated =
    state?.ok === true && state.created === true ? state : null;

  return (
    <>
      {accessoryCreated ? (
        <SuccessChoiceDialog
          open
          title="Erfolgreich gespeichert"
          description="Das neue Zubehör wurde angelegt. Wie möchten Sie fortfahren?"
          overviewLabel="Zur Übersicht"
          continueLabel="Weiter bearbeiten"
          overviewHref="/admin/accessories"
          continueHref={`/admin/accessories/${accessoryCreated.accessoryId}`}
        />
      ) : null}
      <form
        action={formAction}
        className="max-w-xl space-y-4"
      >
      {accessory?.id ? <input type="hidden" name="id" value={accessory.id} /> : null}

      {state?.ok === false ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Name *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={accessory?.name ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="brand">
            Marke
          </label>
          <input
            id="brand"
            name="brand"
            defaultValue={accessory?.brand ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="article_number"
          >
            Artikelnummer
          </label>
          <input
            id="article_number"
            name="article_number"
            defaultValue={accessory?.article_number ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={accessory?.description ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="category_id">
          Kategorie
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={accessory?.category_id ?? ""}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="">— keine Kategorie —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="price_adjustment_eur"
        >
          Preisaufschlag (EUR)
        </label>
        <input
          id="price_adjustment_eur"
          name="price_adjustment_eur"
          type="number"
          step="0.01"
          defaultValue={
            accessory != null
              ? (accessory.price_adjustment_cents / 100).toFixed(2)
              : "0"
          }
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={accessory?.active ?? true}
          className="rounded border-zinc-300"
        />
        <label htmlFor="active" className="text-sm">
          Aktiv
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="image">
          Bild {accessory ? "(optional ersetzen)" : ""}
        </label>
        <input id="image" name="image" type="file" accept="image/*" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Speichern…" : "Speichern"}
      </button>
    </form>
    </>
  );
}
