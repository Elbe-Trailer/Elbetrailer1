import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
import { createClient } from "@/lib/supabase/server";

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/anhaenger", priority: 0.9 },
  { path: "/mieten", priority: 0.9 },
  { path: "/blog", priority: 0.7 },
  { path: "/ueber-uns", priority: 0.5 },
  { path: "/service", priority: 0.6 },
  { path: "/kontakt", priority: 0.5 },
  { path: "/impressum", priority: 0.3 },
  { path: "/datenschutz", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const supabase = await createClient();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority,
  }));

  const { data: legalPages } = await supabase
    .from("site_pages")
    .select("slug, updated_at")
    .in("slug", ["impressum", "datenschutz"]);

  for (const page of legalPages ?? []) {
    const path = `/${page.slug}`;
    const idx = entries.findIndex((e) => e.url === `${base}${path}`);
    if (idx >= 0 && page.updated_at) {
      entries[idx] = {
        ...entries[idx],
        lastModified: new Date(page.updated_at),
      };
    }
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true);

  for (const cat of categories ?? []) {
    entries.push({
      url: `${base}/kategorie/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("slug, updated_at")
    .eq("published", true);

  for (const listing of listings ?? []) {
    if (!listing.slug) continue;
    entries.push({
      url: `${base}${listingPublicPath(listing.slug)}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("published", true);

  for (const post of posts ?? []) {
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
