import type { Metadata } from "next";
import Link from "next/link";
import ContentContainer from "@/components/ContentContainer";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";
import StorageImage from "@/components/StorageImage";

type Props = { searchParams: Promise<{ cat?: string }> };

export const metadata: Metadata = buildPageMetadata({
  title: "Blog & Ratgeber",
  description:
    "Ratgeber und Neuigkeiten rund um Anhänger — Kauf, Miete, Zulassung und mehr bei elbe-trailer.",
  path: "/blog",
});

export default async function BlogListPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const catSlug = (cat ?? "").trim();
  const supabase = await createClient();

  let categories: { slug: string; name: string }[] = [];
  let posts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    published_at: string | null;
    cover_image_path: string | null;
    blog_categories: { slug: string; name: string } | null;
  }[] = [];

  try {
    const { data: cats } = await supabase
      .from("blog_categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    categories = cats ?? [];

    let postsQuery = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, published_at, cover_image_path, blog_categories ( slug, name )",
      )
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (catSlug) {
      const { data: catRow } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", catSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (catRow?.id) {
        postsQuery = postsQuery.eq("category_id", catRow.id);
      }
    }

    const { data: p } = await postsQuery;
    posts = (p ?? []).map((row) => {
      const rel = row.blog_categories as
        | { slug: string; name: string }
        | { slug: string; name: string }[]
        | null
        | undefined;
      const blog_categories = Array.isArray(rel) ? rel[0] ?? null : rel ?? null;
      return {
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        excerpt: (row.excerpt as string | null) ?? null,
        published_at: (row.published_at as string | null) ?? null,
        cover_image_path: (row.cover_image_path as string | null) ?? null,
        blog_categories,
      };
    });
  } catch {
    /* offline / tables missing */
  }

  return (
    <ContentContainer>
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Blog
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Neuigkeiten, Tipps und Informationen rund um Anhänger.
          </p>
        </header>

        {categories.length > 0 ? (
          <nav
            className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
            aria-label="Kategorien"
          >
            <Link
              href="/blog"
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                !catSlug
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              Alle
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog?cat=${encodeURIComponent(c.slug)}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  catSlug === c.slug
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        ) : null}

        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
            Noch keine Beiträge. Sobald im Admin welche veröffentlicht sind,
            erscheinen sie hier.
          </p>
        ) : (
          <ul className="space-y-10">
            {posts.map((post) => {
              const category = post.blog_categories;
              const coverPath =
                post.cover_image_path != null && post.cover_image_path !== ""
                  ? post.cover_image_path
                  : null;
              const dateLabel = post.published_at
                ? new Date(post.published_at).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : null;
              return (
                <li key={post.id}>
                  <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="md:flex">
                      {coverPath ? (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="relative block aspect-[16/10] w-full shrink-0 md:aspect-auto md:w-72"
                        >
                          <StorageImage
                            bucket="blog"
                            path={coverPath}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 288px"
                          />
                        </Link>
                      ) : null}
                      <div className="flex flex-1 flex-col justify-center p-6">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          {dateLabel ? <time>{dateLabel}</time> : null}
                          {category ? (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {category.name}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="hover:text-brand dark:hover:text-red-400"
                          >
                            {post.title}
                          </Link>
                        </h2>
                        {post.excerpt ? (
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {post.excerpt}
                          </p>
                        ) : null}
                        <Link
                          href={`/blog/${post.slug}`}
                          className="mt-4 inline-flex text-sm font-medium text-amber-800 hover:underline dark:text-amber-400"
                        >
                          Weiterlesen →
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ContentContainer>
  );
}
