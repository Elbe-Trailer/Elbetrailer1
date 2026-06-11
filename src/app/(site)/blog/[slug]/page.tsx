import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminInlinePostEditor from "@/components/blog/AdminInlinePostEditor";
import BlogMarkdown from "@/components/BlogMarkdown";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildBlogPostingSchema } from "@/lib/seo/listing-schema";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/storage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data: post } = await supabase
      .from("blog_posts")
      .select("title, excerpt, cover_image_path")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!post) return { title: "Blog" };
    const cover =
      post.cover_image_path != null && post.cover_image_path !== ""
        ? publicStorageUrl("blog", post.cover_image_path)
        : null;
    return buildPageMetadata({
      title: post.title,
      description: post.excerpt ?? undefined,
      path: `/blog/${slug}`,
      image: cover,
      type: "article",
    });
  } catch {
    return { title: "Blog" };
  }
}

export default async function BlogPostPublicPage({ params }: Props) {
  const { slug } = await params;
  const adminSession = await getOptionalAdmin();
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content, author, published_at, cover_image_path, blog_categories ( slug, name )",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !post) notFound();

  const rel = post.blog_categories as
    | { slug: string; name: string }
    | null
    | { slug: string; name: string }[];
  const category = Array.isArray(rel) ? rel[0] : rel;

  const cover =
    post.cover_image_path != null && post.cover_image_path !== ""
      ? publicStorageUrl("blog", post.cover_image_path)
      : null;

  const dateLabel = post.published_at
    ? new Date(post.published_at).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <ContentContainer>
      <JsonLd
        data={buildBlogPostingSchema(
          {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            author: post.author,
            published_at: post.published_at,
            cover_image_path: post.cover_image_path,
          },
          cover,
        )}
      />
      <article className="mx-auto max-w-3xl space-y-8 pb-12">
        <nav className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/blog" className="hover:underline">
            ← Blog
          </Link>
        </nav>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {dateLabel ? <time>{dateLabel}</time> : null}
            {category ? (
              <Link
                href={`/blog?cat=${encodeURIComponent(category.slug)}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {category.name}
              </Link>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
            {post.title}
          </h1>
          {post.author ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Von {post.author}
            </p>
          ) : null}
          {post.excerpt ? (
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {cover ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={cover}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
          </div>
        ) : null}

        {adminSession ? (
          <AdminInlinePostEditor
            postId={post.id}
            slug={post.slug}
            initialContent={post.content}
          />
        ) : (
          <BlogMarkdown markdown={post.content} />
        )}
      </article>
    </ContentContainer>
  );
}
