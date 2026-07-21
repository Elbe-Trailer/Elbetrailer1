import { unstable_cache } from "next/cache";
import {
  SITE_CACHE_REVALIDATE_SECONDS,
  SITE_CACHE_TAGS,
} from "@/lib/cache/tags";
import {
  MARKETING_CONTENT_FALLBACKS,
  MARKETING_CONTENT_KEYS,
  getMarketingContentMap,
  type MarketingContentKey,
} from "@/lib/marketing-content";
import { createAnonServerClient } from "@/lib/supabase/anon-server";
import {
  getPublishedBrands,
  mergeAuthoredBrands,
  type PublishedBrand,
} from "@/lib/brands";
import type { Listing } from "@/types/database";

export type SiteCategory = { slug: string; name: string };

export type HomeFeaturedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  blog_categories: { slug: string; name: string } | null;
};

export type HomePortfolioListing = Pick<
  Listing,
  | "id"
  | "slug"
  | "title"
  | "price_cents"
  | "daily_rate_cents"
  | "listing_type"
  | "gallery_paths"
>;

export const getCachedActiveCategories = unstable_cache(
  async (): Promise<SiteCategory[]> => {
    try {
      const supabase = createAnonServerClient();
      const { data } = await supabase
        .from("categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["site-active-categories"],
  {
    revalidate: SITE_CACHE_REVALIDATE_SECONDS,
    tags: [SITE_CACHE_TAGS.categories],
  },
);

/**
 * Marken mit veröffentlichten Kauf-Inseraten (für Footer-Markenlinks & Co.).
 * Zeitbasiert revalidiert; für sofortige Aktualisierung bei Inserats-Änderungen
 * kann später `revalidateTag(SITE_CACHE_TAGS.brands)` in den Admin-Actions ergänzt werden.
 */
export const getCachedPublishedBrands = unstable_cache(
  async (): Promise<PublishedBrand[]> => {
    try {
      const supabase = createAnonServerClient();
      return await getPublishedBrands(supabase);
    } catch {
      return [];
    }
  },
  ["site-published-brands"],
  {
    revalidate: SITE_CACHE_REVALIDATE_SECONDS,
    tags: [SITE_CACHE_TAGS.brands],
  },
);

/**
 * Indexierbare Markenseiten für Footer/Navigation — gepflegte Marken inkl.
 * bestandsloser (kaufCount = 0), damit sie intern verlinkt und crawlbar sind.
 */
export async function getCachedIndexableBrands(): Promise<PublishedBrand[]> {
  return mergeAuthoredBrands(await getCachedPublishedBrands());
}

export const getCachedMarketingContentMap = unstable_cache(
  async () => {
    try {
      const supabase = createAnonServerClient();
      return getMarketingContentMap(supabase, MARKETING_CONTENT_KEYS);
    } catch {
      return MARKETING_CONTENT_KEYS.reduce(
        (acc, key) => {
          acc[key] = MARKETING_CONTENT_FALLBACKS[key].content;
          return acc;
        },
        {} as Record<MarketingContentKey, string>,
      );
    }
  },
  ["site-marketing-content"],
  {
    revalidate: SITE_CACHE_REVALIDATE_SECONDS,
    tags: [SITE_CACHE_TAGS.marketing],
  },
);

export function pickMarketingContent<K extends MarketingContentKey>(
  full: Record<MarketingContentKey, string>,
  keys: readonly K[],
): Record<K, string> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = full[key];
      return acc;
    },
    {} as Record<K, string>,
  );
}

function normalizeBlogCategory(
  rel:
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null
    | undefined,
) {
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel ?? null;
}

export const getCachedHomePageData = unstable_cache(
  async (): Promise<{
    portfolio: HomePortfolioListing[];
    featuredPosts: HomeFeaturedPost[];
  }> => {
    let portfolio: HomePortfolioListing[] = [];
    let featuredPosts: HomeFeaturedPost[] = [];

    try {
      const supabase = createAnonServerClient();

      const [highlightResult, postsResult] = await Promise.all([
        supabase
          .from("listing_highlights")
          .select("listing_id, position")
          .order("position", { ascending: true }),
        supabase
          .from("blog_posts")
          .select(
            "id, slug, title, excerpt, published_at, blog_categories ( slug, name )",
          )
          .eq("published", true)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(3),
      ]);

      const ids = highlightResult.data?.map((h) => h.listing_id) ?? [];
      if (ids.length) {
        const { data: listings } = await supabase
          .from("listings")
          .select(
            "id, slug, title, price_cents, daily_rate_cents, listing_type, gallery_paths",
          )
          .in("id", ids);
        const map = new Map(
          (listings ?? []).map((l) => [l.id as string, l as Listing]),
        );
        portfolio = ids
          .map((id) => map.get(id))
          .filter(Boolean) as HomePortfolioListing[];
      }

      featuredPosts = (postsResult.data ?? []).map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        excerpt: (row.excerpt as string | null) ?? null,
        published_at: (row.published_at as string | null) ?? null,
        blog_categories: normalizeBlogCategory(
          row.blog_categories as
            | { slug: string; name: string }
            | { slug: string; name: string }[]
            | null
            | undefined,
        ),
      }));
    } catch {
      /* DB unavailable */
    }

    return { portfolio, featuredPosts };
  },
  ["site-home-page-data"],
  {
    revalidate: SITE_CACHE_REVALIDATE_SECONDS,
    tags: [SITE_CACHE_TAGS.home],
  },
);

export const HEADER_MARKETING_KEYS = [
  "header.brand",
  "header.menu.trailers",
  "header.menu.all_trailers",
  "header.menu.no_categories",
  "header.menu.rent",
  "header.nav.about",
  "header.nav.service",
  "header.nav.rent_trailers",
  "header.nav.blog",
  "header.nav.contact",
  "header.mobile.categories_title",
  "header.mobile.no_categories",
  "header.mobile.menu_open",
  "header.mobile.menu_close",
] as const satisfies readonly MarketingContentKey[];

export const FOOTER_MARKETING_KEYS = [
  "footer.brand",
  "footer.description",
  "footer.section.categories",
  "footer.section.offer",
  "footer.section.legal",
  "footer.categories.empty",
  "footer.link.rent",
  "footer.link.highlights",
  "footer.link.category_overview",
  "footer.link.blog",
  "footer.link.about",
  "footer.link.contact",
  "footer.link.imprint",
  "footer.link.privacy",
  "footer.note.inquiries",
] as const satisfies readonly MarketingContentKey[];
