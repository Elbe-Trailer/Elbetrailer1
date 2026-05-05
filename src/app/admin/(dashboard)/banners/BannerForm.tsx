"use client";

import { useActionState } from "react";
import type { BannerSlide } from "@/types/database";
import { saveBanner, type SaveBannerState } from "./actions";

type Props = { banner?: BannerSlide };

export default function BannerForm({ banner }: Props) {
  const [state, formAction, pending] = useActionState<SaveBannerState, FormData>(
    saveBanner,
    undefined,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      {banner?.id ? <input type="hidden" name="id" value={banner.id} /> : null}

      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950/50">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium" htmlFor="image">
          Bild {!banner ? "*" : "(optional ersetzen)"}
        </label>
        <input id="image" name="image" type="file" accept="image/*" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" htmlFor="sort_order">
          Sortierung
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={banner?.sort_order ?? 0}
          className="w-32 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" htmlFor="link_url">
          Link (optional)
        </label>
        <input
          id="link_url"
          name="link_url"
          type="url"
          defaultValue={banner?.link_url ?? ""}
          placeholder="https://…"
          className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active"
          name="active"
          type="checkbox"
          defaultChecked={banner?.active ?? true}
        />
        <label htmlFor="active" className="text-sm">
          Aktiv
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900"
      >
        {pending ? "…" : "Speichern"}
      </button>
    </form>
  );
}
