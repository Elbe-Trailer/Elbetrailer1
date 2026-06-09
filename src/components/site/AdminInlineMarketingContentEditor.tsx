"use client";

import { useActionState, useState } from "react";
import { updateMarketingContent } from "@/app/(site)/marketing-content/actions";
import type { MarketingContentKey } from "@/lib/marketing-content";

type State = { ok: false; error: string } | { ok: true } | undefined;

type Props = {
  contentKey: MarketingContentKey;
  value: string;
  isAdmin: boolean;
  multiline?: boolean;
  inlineOnly?: boolean;
  className?: string;
};

export default function AdminInlineMarketingContentEditor({
  contentKey,
  value: initialValue,
  isAdmin,
  multiline = false,
  inlineOnly = false,
  className,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateMarketingContent,
    undefined,
  );

  if (!isAdmin) {
    return <span className={className}>{value}</span>;
  }

  if (!editing || inlineOnly) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={className}>{value}</span>
        {inlineOnly ? null : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-amber-500 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-100"
          >
            Bearbeiten
          </button>
        )}
      </span>
    );
  }

  return (
    <form
      action={formAction}
      className={`inline-flex w-full flex-col gap-2 rounded-lg border p-2 ${
        multiline
          ? "border-white/40 bg-black/55 shadow-lg backdrop-blur-sm"
          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
      }`}
    >
      <input type="hidden" name="key" value={contentKey} />
      <input type="hidden" name="content" value={value} />
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
      )}
      <div className="inline-flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white ring-1 ring-white/20 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Speichern ..." : "Speichern"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValue(initialValue);
            setEditing(false);
          }}
          className="rounded border border-zinc-300 bg-white/10 px-2 py-1 text-xs text-white dark:border-zinc-600"
        >
          Abbrechen
        </button>
      </div>
      {state?.ok === false ? (
        <p className="text-xs text-red-600 dark:text-red-300">{state.error}</p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-300">Gespeichert.</p>
      ) : null}
    </form>
  );
}
