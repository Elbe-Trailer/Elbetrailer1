import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import type { BlogPost } from "@/types/database";
import BlogPostForm from "./BlogPostForm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogEditPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  const cats =
    (categories ?? []) as { id: string; name: string; slug: string }[];

  if (id === "new") {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/blog"
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            ← Zur Liste
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Neuer Blog-Beitrag
        </h1>
        <BlogPostForm post={null} categories={cats} />
      </div>
    );
  }

  if (!UUID_RE.test(id)) notFound();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="text-sm text-zinc-500 underline dark:text-zinc-400"
        >
          ← Zur Liste
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Beitrag bearbeiten
      </h1>
      <BlogPostForm post={post as BlogPost} categories={cats} />
    </div>
  );
}
