"use client";

import { useActionState, useState } from "react";
import { updateSitePageContent } from "@/app/(site)/site-pages/actions";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import BlogMarkdown from "@/components/BlogMarkdown";
import BlogRichTextEditor from "@/components/blog/BlogRichTextEditor";
import type { SitePageSlug } from "@/lib/site-pages";

type State = { ok: false; error: string } | { ok: true } | undefined;

type Props = {
  slug: SitePageSlug;
  title: string;
  content: string;
};

export default function AdminInlineSitePageEditor({
  slug,
  title,
  content: initialContent,
}: Props) {
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateSitePageContent,
    undefined,
  );

  if (!isAdmin) {
    return <BlogMarkdown markdown={content} />;
  }

  if (!editing) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            Admin-Modus aktiv
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-amber-500 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-100"
          >
            Inhalt direkt bearbeiten
          </button>
        </div>
        <BlogMarkdown markdown={content} />
      </section>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
        <span className="font-medium text-amber-900 dark:text-amber-100">
          Admin-Bearbeitung
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setContent(initialContent);
              setEditing(false);
            }}
            className="rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-600"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            {pending ? "Speichern ..." : "Speichern"}
          </button>
        </div>
      </div>

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="content" value={content} />

      <BlogRichTextEditor
        value={content}
        onChange={setContent}
        placeholder={`${title} bearbeiten ...`}
      />

      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          Gespeichert.
        </p>
      ) : null}
    </form>
  );
}
