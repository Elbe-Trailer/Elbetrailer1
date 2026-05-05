"use client";

import { useActionState, useState } from "react";
import { updateBlogPostContent } from "@/app/admin/(dashboard)/blog/actions";
import BlogMarkdown from "@/components/BlogMarkdown";
import BlogRichTextEditor from "@/components/blog/BlogRichTextEditor";

type State = { ok: false; error: string } | { ok: true } | undefined;

type Props = {
  postId: string;
  slug: string;
  initialContent: string;
};

export default function AdminInlinePostEditor({
  postId,
  slug,
  initialContent,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateBlogPostContent,
    undefined,
  );

  if (!isEditing) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            Admin-Modus aktiv
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded border border-amber-500 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-100"
          >
            Beitrag direkt bearbeiten
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
              setIsEditing(false);
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

      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="content" value={content} />

      <BlogRichTextEditor value={content} onChange={setContent} />

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
