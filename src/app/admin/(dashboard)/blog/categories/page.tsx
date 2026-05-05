import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import BlogCategoryForm from "./BlogCategoryForm";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminBlogCategoriesPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: cats } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin/blog"
          className="text-sm text-zinc-500 underline dark:text-zinc-400"
        >
          ← Zur Blog-Liste
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Blog-Kategorien
      </h1>

      {error === "in-use" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Diese Kategorie kann nicht gelöscht werden, solange noch Beiträge
          zugeordnet sind. Bitte zuerst die betroffenen Beiträge umstellen.
        </p>
      ) : null}
      {error === "delete-failed" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Löschen fehlgeschlagen.
        </p>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Neue Kategorie</h2>
        <BlogCategoryForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Bearbeiten</h2>
        <ul className="space-y-8">
          {(cats ?? []).map((c) => (
            <li
              key={c.id}
              className="border-b border-zinc-200 pb-8 dark:border-zinc-700"
            >
              <p className="mb-2 text-sm text-zinc-500">
                Filter-URL:{" "}
                <Link
                  href={`/blog?cat=${c.slug}`}
                  className="text-amber-700 hover:underline dark:text-amber-400"
                >
                  /blog?cat={c.slug}
                </Link>
              </p>
              <BlogCategoryForm category={c} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
