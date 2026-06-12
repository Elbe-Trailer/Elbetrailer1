import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import StorageImage from "@/components/StorageImage";
import { deleteBlogPost } from "./actions";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminBlogPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const { supabase } = await requireAdmin();

  let postsQuery = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, cover_image_path, published, published_at, updated_at, blog_categories ( name, slug )",
    )
    .order("updated_at", { ascending: false });

  if (query) {
    postsQuery = postsQuery.or(
      `title.ilike.%${query}%,slug.ilike.%${query}%`,
    );
  }

  const { data: posts } = await postsQuery;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Blog
        </h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Neuer Beitrag
        </Link>
      </div>

      <form
        method="get"
        className="flex max-w-xl flex-wrap items-end gap-3"
        role="search"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="blog-q" className="mb-1 block text-xs font-medium">
            Suche (Titel oder Slug)
          </label>
          <input
            id="blog-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="z. B. Anhänger …"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        >
          Filtern
        </button>
        {query ? (
          <Link
            href="/admin/blog"
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            Zurücksetzen
          </Link>
        ) : null}
      </form>

      {!posts?.length ? (
        <p className="text-zinc-500">
          {query
            ? "Keine Beiträge für diese Suche."
            : "Noch keine Beiträge. Legen Sie einen neuen an."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Bild
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Titel
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Kategorie
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Datum
                </th>
                <th className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {posts.map((row) => {
                const cat = row.blog_categories as
                  | { name: string; slug: string }
                  | null
                  | { name: string; slug: string }[];
                const category = Array.isArray(cat) ? cat[0] : cat;
                const dateStr =
                  row.published && row.published_at
                    ? new Date(row.published_at).toLocaleDateString("de-DE")
                    : new Date(row.updated_at).toLocaleDateString("de-DE");
                const coverPath =
                  row.cover_image_path != null && row.cover_image_path !== ""
                    ? row.cover_image_path
                    : null;
                return (
                  <tr key={row.id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3">
                      {coverPath ? (
                        <div className="relative h-12 w-16 overflow-hidden rounded border border-zinc-200 dark:border-zinc-700">
                          <StorageImage
                            bucket="blog"
                            path={coverPath}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blog/${row.id}`}
                        className="font-medium text-amber-800 hover:underline dark:text-amber-400"
                      >
                        {row.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">/{row.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.published ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
                          Veröffentlicht
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                          Entwurf
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {row.published ? "Pub. " : "Geänd. "}
                      {dateStr}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/blog/${row.id}`}
                          className="text-sm text-zinc-700 underline dark:text-zinc-300"
                        >
                          Bearbeiten
                        </Link>
                        <form action={deleteBlogPost}>
                          <input type="hidden" name="id" value={row.id} />
                          <ConfirmDeleteButton
                            label="Löschen"
                            confirmMessage="Beitrag wirklich löschen?"
                            className="text-sm text-red-600 hover:underline"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-zinc-500">
        <Link href="/admin/blog/categories" className="text-amber-800 underline dark:text-amber-400">
          Blog-Kategorien verwalten
        </Link>
      </p>
    </div>
  );
}
