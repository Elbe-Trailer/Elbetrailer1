"use client";

import { useActionState } from "react";
import type { Category } from "@/types/database";
import {
  deleteCategory,
  saveCategory,
  type SaveCategoryState,
} from "./actions";

type Props = { category?: Category };

export default function CategoryForm({ category }: Props) {
  const [state, formAction, pending] = useActionState<
    SaveCategoryState,
    FormData
  >(saveCategory, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      {category?.id ? (
        <input type="hidden" name="id" value={category.id} />
      ) : null}

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
        <label className="mb-1 block text-xs font-medium" htmlFor="slug">
          Slug *
        </label>
        <input
          id="slug"
          name="slug"
          required
          defaultValue={category?.slug ?? ""}
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
          In Navigation sichtbar
        </label>
      </div>

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
            formAction={deleteCategory}
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
