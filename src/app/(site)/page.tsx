import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buildPageMetadata } from "@/lib/seo/metadata";
import FullBleed from "@/components/FullBleed";
import HomeHero from "@/components/home/HomeHero";
import HomeTrustStrip from "@/components/home/HomeTrustStrip";
import ListingCard from "@/components/ListingCard";
import {
  getCategoryIconKey,
  getCategoryIconPath,
  getCategoryIconScale,
} from "@/lib/categoryIcons";
import { getOptionalAdmin } from "@/lib/auth/admin";
import {
  MARKETING_CONTENT_KEYS,
  getMarketingContentMap,
} from "@/lib/marketing-content";
import AdminInlineMarketingContentEditor from "@/components/site/AdminInlineMarketingContentEditor";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

export const metadata: Metadata = buildPageMetadata({
  title: "Anhänger kaufen & mieten",
  description:
    "Anhänger kaufen oder mieten — Kategorien, Zubehör-Konfiguration und unverbindliche Anfrage bei elbe-trailer.",
  path: "/",
});

type HomeCategory = { slug: string; name: string };

function TrailerSketch({ category }: { category: HomeCategory }) {
  const iconPath = getCategoryIconPath(category);
  const iconKey = getCategoryIconKey(category);
  const iconScale = getCategoryIconScale(category);
  const iconTranslateX = iconKey === "bootstrailer" ? "-6%" : "0%";
  const iconTranslateY = iconKey === "bootstrailer" ? "10%" : "0%";

  if (iconPath) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <Image
          src={iconPath}
          alt=""
          width={320}
          height={120}
          className="h-auto max-h-full w-full max-w-[248px] object-contain object-center sm:max-w-[280px] lg:max-w-[300px]"
          sizes="(max-width: 640px) 48vw, (max-width: 1024px) 264px, 312px"
          style={{
            transform: `translate(${iconTranslateX}, ${iconTranslateY}) scale(${iconScale})`,
            transformOrigin: "center",
          }}
        />
      </div>
    );
  }

  return <div className="h-full w-full rounded bg-zinc-100 dark:bg-zinc-800" aria-hidden />;
}

async function loadHome() {
  let categories: HomeCategory[] = [];
  let portfolio: Pick<
    Listing,
    | "id"
    | "slug"
    | "title"
    | "price_cents"
    | "daily_rate_cents"
    | "listing_type"
    | "gallery_paths"
  >[] = [];
  let featuredPosts: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    published_at: string | null;
    blog_categories: { slug: string; name: string } | null;
  }[] = [];

  try {
    const supabase = await createClient();
    const { data: cats } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = cats ?? [];

    const { data: highlightRows } = await supabase
      .from("listing_highlights")
      .select("listing_id, position")
      .order("position", { ascending: true });

    const ids = highlightRows?.map((h) => h.listing_id) ?? [];
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
        .filter(Boolean) as typeof portfolio;
    }

    const { data: posts } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, published_at, blog_categories ( slug, name )",
      )
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3);

    featuredPosts = (posts ?? []).map((row) => {
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
        blog_categories,
      };
    });
  } catch {
    /* DB unavailable */
  }

  return { categories, portfolio, featuredPosts };
}

export default async function HomePage() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  const { categories, portfolio, featuredPosts } = await loadHome();
  const copy = await getMarketingContentMap(supabase, MARKETING_CONTENT_KEYS);
  const isAdmin = Boolean(admin);

  return (
    <>
      <HomeHero
        copy={{
          brand: copy["home.hero.brand"],
          title: copy["home.hero.title"],
          subtitle: copy["home.hero.subtitle"],
          ctaBuy: copy["home.hero.cta_buy"],
          ctaRent: copy["home.hero.cta_rent"],
        }}
        isAdmin={isAdmin}
      />

      <HomeTrustStrip
        copy={{
          item1: copy["home.trust.item1"],
          item2: copy["home.trust.item2"],
          item3: copy["home.trust.item3"],
          item4: copy["home.trust.item4"],
        }}
        isAdmin={isAdmin}
      />

      <FullBleed className="rounded-t-3xl bg-[var(--surface-card)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <section className="scroll-mt-28 mx-auto max-w-7xl space-y-8 px-4 py-12 md:py-16" id="kategorien">
          {categories.length > 0 ? (
            <div className="space-y-8" aria-labelledby="kategorien-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-wide text-[var(--header-green)] uppercase">
                    <AdminInlineMarketingContentEditor
                      contentKey="home.categories.overline"
                      value={copy["home.categories.overline"]}
                      isAdmin={isAdmin}
                    />
                  </p>
                  <h2
                    id="kategorien-heading"
                    className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
                  >
                    <AdminInlineMarketingContentEditor
                      contentKey="home.categories.heading"
                      value={copy["home.categories.heading"]}
                      isAdmin={isAdmin}
                    />
                  </h2>
                </div>
                <Link
                  href="/mieten"
                  className="text-sm font-medium text-[var(--header-green)] hover:underline"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="home.categories.rental_link"
                    value={copy["home.categories.rental_link"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/kategorie/${c.slug}`}
                      className="group grid h-full min-h-[160px] grid-rows-[170px_auto_auto] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                    >
                      <TrailerSketch category={c} />
                      <span className="text-lg font-semibold text-zinc-900 group-hover:text-[var(--header-green)] dark:text-white">
                        {c.name}
                      </span>
                      <span className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <AdminInlineMarketingContentEditor
                          contentKey="home.categories.card_cta"
                          value={copy["home.categories.card_cta"]}
                          isAdmin={isAdmin}
                          inlineOnly
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </FullBleed>

      <div className="mx-auto w-full max-w-7xl space-y-20 px-4 py-16 md:py-20">

        <section
          className="scroll-mt-28 space-y-8"
          id="angebote"
          aria-labelledby="angebote-heading"
        >
          <div
            id="angebote-heading"
            role="heading"
            aria-level={2}
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
          >
            <AdminInlineMarketingContentEditor
              contentKey="home.highlights.heading"
              value={copy["home.highlights.heading"]}
              isAdmin={isAdmin}
            />
          </div>
          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
              <AdminInlineMarketingContentEditor
                contentKey="home.highlights.empty_state"
                value={copy["home.highlights.empty_state"]}
                isAdmin={isAdmin}
                multiline
              />
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} mode="kauf" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="scroll-mt-28 space-y-8" id="blog" aria-labelledby="blog-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="blog-heading"
              className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
            >
              Blog Beiträge
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-brand hover:underline dark:text-red-400"
            >
              Alle Beiträge ansehen →
            </Link>
          </div>

          {featuredPosts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
              Noch keine Blog-Beiträge veröffentlicht.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => {
                const dateLabel = post.published_at
                  ? new Date(post.published_at).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null;
                return (
                  <li key={post.id}>
                    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {dateLabel ? <time>{dateLabel}</time> : null}
                        {post.blog_categories ? (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {post.blog_categories.name}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        <Link href={`/blog/${post.slug}`} className="hover:text-brand dark:hover:text-red-400">
                          {post.title}
                        </Link>
                      </h3>
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
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
