"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { publicStorageUrl } from "@/lib/storage";
import type { BlogPost } from "@/types/database";
import { saveBlogPost, type SaveBlogPostState } from "../actions";

type Cat = { id: string; name: string; slug: string };

type Props = {
  post: BlogPost | null;
  categories: Cat[];
};

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugifyHint(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export default function BlogPostForm({ post, categories }: Props) {
  const [state, formAction, pending] = useActionState<
    SaveBlogPostState,
    FormData
  >(saveBlogPost, undefined);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [content, setContent] = useState(post?.content ?? "");

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyHint(title));
    }
  }, [title, slugTouched]);

  const slugPreview = useMemo(() => {
    const s = slug.trim();
    if (s) return s;
    return slugifyHint(title);
  }, [slug, title]);

  const coverSrc =
    post?.cover_image_path != null && post.cover_image_path !== ""
      ? publicStorageUrl("blog", post.cover_image_path)
      : null;

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="id" value={post?.id ?? "new"} />

      {state?.ok === false ? (
        <p className="rounded bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950/50">
          {state.error}
        </p>
      ) : null}

      <div className="grid max-w-6xl gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="title">
              Titel *
            </label>
            <input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="slug">
              Slug * (URL: /blog/
              {slugPreview || "…"})
            </label>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full rounded border border-zinc-300 px-2 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="excerpt">
              Teaser / Auszug
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={post?.excerpt ?? ""}
              className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="author">
              Autor
            </label>
            <input
              id="author"
              name="author"
              defaultValue={post?.author ?? ""}
              className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              htmlFor="category_id"
            >
              Kategorie
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={post?.category_id ?? ""}
              className="w-full rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="">— keine —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="cover">
              Coverbild {!post ? "(optional)" : "(optional ersetzen)"}
            </label>
            <input id="cover" name="cover" type="file" accept="image/*" />
            {coverSrc ? (
              <div className="relative mt-3 h-40 w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                <Image
                  src={coverSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="400px"
                  unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="published"
              name="published"
              type="checkbox"
              defaultChecked={post?.published ?? false}
            />
            <label htmlFor="published" className="text-sm">
              Veröffentlicht
            </label>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-medium"
              htmlFor="published_at"
            >
              Veröffentlichungsdatum (optional, leer = jetzt / bestehend)
            </label>
            <input
              id="published_at"
              name="published_at"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(post?.published_at)}
              className="w-full max-w-xs rounded border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" htmlFor="content">
              Inhalt (Markdown)
            </label>
            <textarea
              id="content"
              name="content"
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900"
          >
            {pending ? "…" : "Speichern"}
          </button>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Vorschau
          </p>
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            <div className="blog-md-preview max-w-none text-zinc-800 dark:text-zinc-200 [&_a]:text-amber-700 [&_a]:underline dark:[&_a]:text-amber-400 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 [&_code]:text-sm dark:[&_code]:bg-zinc-800 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-200 [&_pre]:p-3 dark:[&_pre]:bg-zinc-800 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-zinc-300 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-zinc-500">Noch kein Markdown …</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
