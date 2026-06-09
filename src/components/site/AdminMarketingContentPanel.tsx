"use client";

import { useActionState, useMemo, useState } from "react";
import BlogRichTextEditor from "@/components/blog/BlogRichTextEditor";
import { updateMarketingContentBatch } from "@/app/(site)/marketing-content/actions";
import type { MarketingContentKey } from "@/lib/marketing-content";

type Props = {
  isAdmin: boolean;
  entries: { key: MarketingContentKey; label: string; content: string }[];
};

type State = { ok: false; error: string } | { ok: true } | undefined;

export default function AdminMarketingContentPanel({ isAdmin, entries }: Props) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<MarketingContentKey, string>>(
    () =>
      entries.reduce(
        (acc, entry) => {
          acc[entry.key] = entry.content;
          return acc;
        },
        {} as Record<MarketingContentKey, string>,
      ),
  );
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateMarketingContentBatch,
    undefined,
  );
  const payload = useMemo(
    () => JSON.stringify(entries.map((entry) => ({ key: entry.key, content: values[entry.key] ?? "" }))),
    [entries, values],
  );

  if (!isAdmin) return null;

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
      <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
        Admin: Marketingtexte bearbeiten
      </h2>
      <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
        Zentraler Bearbeitungsmodus fuer Landingpage, Header und Footer.
      </p>
      {!editing ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            Alle Texte bearbeiten
          </button>
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="entries" value={payload} />
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map((entry) => (
              <div key={entry.key} className="space-y-1 rounded border border-amber-200 bg-white p-3 dark:border-amber-700/50 dark:bg-zinc-900">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{entry.label}</p>
                <BlogRichTextEditor
                  value={values[entry.key] ?? ""}
                  onChange={(next) =>
                    setValues((prev) => ({
                      ...prev,
                      [entry.key]: next,
                    }))
                  }
                  placeholder={`${entry.label} bearbeiten ...`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              {pending ? "Speichern ..." : "Alle Aenderungen speichern"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
            >
              Bearbeitung beenden
            </button>
          </div>
          {state?.ok === false ? (
            <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
              {state.error}
            </p>
          ) : null}
          {state?.ok === true ? (
            <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
              Alle Inhalte gespeichert.
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
