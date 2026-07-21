import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqPageSchema,
  buildItemListSchema,
} from "@/lib/seo/listing-schema";
import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
import { normalizeSlug } from "@/lib/slug";
import {
  BRAND_META,
  brandDisplayName,
  brandHasAuthoredContent,
  brandSlug,
  resolvePublishedBrand,
} from "@/lib/brands";
import ListingFilters from "@/components/ListingFilters";
import ListingCard from "@/components/ListingCard";
import {
  listingSortOrder,
  parseListingFilters,
  type ListingFilterSearchParams,
} from "@/lib/listingFilters";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingFilterSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = normalizeSlug(slug);
  const meta = BRAND_META[targetSlug];
  const authored = brandHasAuthoredContent(targetSlug);
  const supabase = await createClient();
  const brand = await resolvePublishedBrand(supabase, targetSlug);
  // Weder redaktioneller Text noch Bestand → keine echte Markenseite.
  if (!authored && !brand) {
    return { title: "Marke", robots: { index: false, follow: false } };
  }
  const displayName =
    brand?.displayName ?? meta?.displayName ?? targetSlug;
  const description =
    meta?.metaDescription ??
    meta?.intro?.[0]?.slice(0, 160) ??
    `${displayName} Anhänger kaufen bei elbe-trailer — Inserate, technische Daten und unverbindliche Anfrage. Lieferung deutschlandweit auf Anfrage.`;
  return buildPageMetadata({
    title: meta?.metaTitle ?? `${displayName} Anhänger kaufen`,
    // Kuratierte Titles sind auf ~60 Zeichen getrimmt und sollen ohne das
    // "| elbe-trailer"-Suffix ausgegeben werden, damit die Grenze hält.
    titleAbsolute: Boolean(meta?.metaTitle),
    description,
    path: `/marke/${targetSlug}`,
    // Indexierbar, sobald redaktioneller Text vorhanden ist — auch ohne aktuellen
    // Bestand (die Seite zeigt dann einen Anfrage-Hinweis statt Inseraten).
    noIndex: !authored,
  });
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const filters = parseListingFilters(sp);
  const supabase = await createClient();

  const targetSlug = normalizeSlug(slug);
  if (!targetSlug) notFound();

  // Alle veröffentlichten Kauf-Inserate dieser Marke — case-insensitiv über den
  // Slug (das Marken-Feld ist Freitext), damit "TA-NO"/"Ta-No" zusammenfallen.
  const { data: brandRows } = await supabase
    .from("listings")
    .select("id, brand")
    .eq("published", true)
    .in("listing_type", ["kauf", "kauf_und_miete"]);

  const matching = (brandRows ?? []).filter(
    (row): row is { id: string; brand: string } =>
      typeof row.brand === "string" && brandSlug(row.brand) === targetSlug,
  );
  const meta = BRAND_META[targetSlug];
  const hasAuthored = brandHasAuthoredContent(targetSlug);
  // Kein Bestand UND kein redaktioneller Text → keine echte Markenseite.
  if (!matching.length && !hasAuthored) notFound();

  const brandListingIds = matching.map((row) => row.id);
  const hasInventory = brandListingIds.length > 0;
  const storedValue =
    matching[0]?.brand.trim() ?? meta?.displayName ?? targetSlug;
  const displayName = brandDisplayName(storedValue, targetSlug);
  const canonicalPath = `/marke/${targetSlug}`;

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = categoriesData ?? [];
  const selectedCategoryIds = filters.category.length
    ? categories
        .filter((category) => filters.category.includes(category.slug))
        .map((category) => category.id)
    : [];

  const optionsData = hasInventory
    ? (
        await supabase
          .from("listings")
          .select(
            "brand, loading_area, tip_function, lighting, loading_ramps, axle_count, tire_size_inch, gross_weight_kg, payload_kg, empty_weight_kg, exterior_length_mm, exterior_width_mm, loading_length_mm, loading_width_mm, price_cents",
          )
          .in("id", brandListingIds)
      ).data
    : [];

  const filterOptions = {
    brands: Array.from(
      new Set((optionsData ?? []).map((x) => x.brand).filter(Boolean)),
    ) as string[],
    loadingAreas: Array.from(
      new Set((optionsData ?? []).map((x) => x.loading_area).filter(Boolean)),
    ) as string[],
    tipFunctions: Array.from(
      new Set((optionsData ?? []).map((x) => x.tip_function).filter(Boolean)),
    ) as string[],
    lightings: Array.from(
      new Set((optionsData ?? []).map((x) => x.lighting).filter(Boolean)),
    ) as string[],
    loadingRamps: Array.from(
      new Set((optionsData ?? []).map((x) => x.loading_ramps).filter(Boolean)),
    ) as string[],
    axleCounts: Array.from(
      new Set((optionsData ?? []).map((x) => x.axle_count).filter((x) => x !== null)),
    ) as number[],
    tireSizes: Array.from(
      new Set((optionsData ?? []).map((x) => x.tire_size_inch).filter((x) => x !== null)),
    ) as number[],
  };

  const ceilToStep = (value: number, step: number) => Math.ceil(value / step) * step;
  const maxOrFallback = (values: Array<number | null | undefined>, fallback: number) => {
    const filtered = values.filter((v): v is number => typeof v === "number");
    return filtered.length ? Math.max(...filtered) : fallback;
  };
  const sliderBounds = {
    grossWeightMax: Math.max(200, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.gross_weight_kg), 35000), 50)),
    payloadMax: Math.max(0, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.payload_kg), 30000), 50)),
    emptyWeightMax: Math.max(0, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.empty_weight_kg), 15000), 25)),
    exteriorLengthMax: Math.max(500, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.exterior_length_mm), 12000), 50)),
    exteriorWidthMax: Math.max(500, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.exterior_width_mm), 3000), 25)),
    loadingLengthMax: Math.max(500, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.loading_length_mm), 10000), 50)),
    loadingWidthMax: Math.max(500, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => x.loading_width_mm), 3000), 25)),
    priceMaxEur: Math.max(0, ceilToStep(maxOrFallback((optionsData ?? []).map((x) => (x.price_cents ?? 0) / 100), 200000), 500)),
  };

  let query = supabase
    .from("listings")
    .select(
      "id, slug, title, price_cents, daily_rate_cents, listing_type, gallery_paths",
    )
    .in("id", brandListingIds);

  if (selectedCategoryIds.length) query = query.in("category_id", selectedCategoryIds);
  if (filters.priceMin !== null) query = query.gte("price_cents", filters.priceMin * 100);
  if (filters.priceMax !== null) query = query.lte("price_cents", filters.priceMax * 100);
  if (filters.braked !== null) query = query.eq("braked", filters.braked);
  if (filters.loadingArea.length) query = query.in("loading_area", filters.loadingArea);
  if (filters.tipFunction.length) query = query.in("tip_function", filters.tipFunction);
  if (filters.lighting.length) query = query.in("lighting", filters.lighting);
  if (filters.loadingRamps.length) query = query.in("loading_ramps", filters.loadingRamps);
  if (filters.grossWeightMin !== null) query = query.gte("gross_weight_kg", filters.grossWeightMin);
  if (filters.grossWeightMax !== null) query = query.lte("gross_weight_kg", filters.grossWeightMax);
  if (filters.payloadMin !== null) query = query.gte("payload_kg", filters.payloadMin);
  if (filters.payloadMax !== null) query = query.lte("payload_kg", filters.payloadMax);
  if (filters.emptyWeightMin !== null) query = query.gte("empty_weight_kg", filters.emptyWeightMin);
  if (filters.emptyWeightMax !== null) query = query.lte("empty_weight_kg", filters.emptyWeightMax);
  if (filters.exteriorLengthMin !== null) query = query.gte("exterior_length_mm", filters.exteriorLengthMin);
  if (filters.exteriorLengthMax !== null) query = query.lte("exterior_length_mm", filters.exteriorLengthMax);
  if (filters.exteriorWidthMin !== null) query = query.gte("exterior_width_mm", filters.exteriorWidthMin);
  if (filters.exteriorWidthMax !== null) query = query.lte("exterior_width_mm", filters.exteriorWidthMax);
  if (filters.loadingLengthMin !== null) query = query.gte("loading_length_mm", filters.loadingLengthMin);
  if (filters.loadingLengthMax !== null) query = query.lte("loading_length_mm", filters.loadingLengthMax);
  if (filters.loadingWidthMin !== null) query = query.gte("loading_width_mm", filters.loadingWidthMin);
  if (filters.loadingWidthMax !== null) query = query.lte("loading_width_mm", filters.loadingWidthMax);
  if (filters.tireValues.length) query = query.in("tire_size_inch", filters.tireValues);
  else {
    if (filters.tireSizeMin !== null) query = query.gte("tire_size_inch", filters.tireSizeMin);
    if (filters.tireSizeMax !== null) query = query.lte("tire_size_inch", filters.tireSizeMax);
  }
  if (filters.axleValues.length) query = query.in("axle_count", filters.axleValues);
  else {
    if (filters.axleCountMin !== null) query = query.gte("axle_count", filters.axleCountMin);
    if (filters.axleCountMax !== null) query = query.lte("axle_count", filters.axleCountMax);
  }

  const sortOrder = listingSortOrder(filters.sort);
  const { data: listings } = hasInventory
    ? await query.order(sortOrder.column, {
        ascending: sortOrder.ascending,
        nullsFirst: sortOrder.nullsFirst,
      })
    : { data: [] };

  const list = (listings ?? []) as Pick<
    Listing,
    | "id"
    | "slug"
    | "title"
    | "price_cents"
    | "daily_rate_cents"
    | "listing_type"
    | "gallery_paths"
  >[];

  const brandUrl = absoluteUrl(canonicalPath);
  const faq = meta?.faq ?? [];

  return (
    <ContentContainer>
      <JsonLd
        data={[
          buildCollectionPageSchema({
            name: `${displayName} Anhänger kaufen`,
            url: brandUrl,
            description: meta?.intro?.[0],
            about: {
              "@type": "Brand",
              name: displayName,
              ...(meta?.manufacturerUrl ? { sameAs: meta.manufacturerUrl } : {}),
            },
          }),
          buildBreadcrumbSchema([
            { name: "Start", url: absoluteUrl("/") },
            { name: "Anhänger kaufen", url: absoluteUrl("/anhaenger") },
            { name: displayName, url: brandUrl },
          ]),
          ...(list.length
            ? [
                buildItemListSchema(
                  list.map((listing) => ({
                    url: absoluteUrl(listingPublicPath(listing.slug)),
                    name: listing.title,
                  })),
                ),
              ]
            : []),
          ...(faq.length ? [buildFaqPageSchema(faq)] : []),
        ]}
      />
      <div className="space-y-8">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/" className="hover:underline">
              Start
            </Link>
            <span className="mx-2">/</span>
            <Link href="/anhaenger" className="hover:underline">
              Anhänger kaufen
            </Link>
            <span className="mx-2">/</span>
            <span>{displayName}</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            {meta?.heading ?? `${displayName} Anhänger kaufen`}
          </h1>

          {meta?.intro?.length ? (
            <div className="mt-4 max-w-3xl space-y-3 text-zinc-600 dark:text-zinc-400">
              {meta.intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-400">
              Alle veröffentlichten {displayName}-Anhänger im Überblick. Lieferung
              in Hamburg und ganz Norddeutschland oder Abholung bei uns in Möhnsen.
            </p>
          )}

          {meta?.sections?.length ? (
            <div className="mt-8 max-w-3xl space-y-8">
              {meta.sections.map((section, index) => (
                <section key={index}>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.length ? (
                    <div className="mt-3 space-y-3 text-zinc-600 dark:text-zinc-400">
                      {section.paragraphs.map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                  {section.bullets?.length ? (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-zinc-600 marker:text-brand dark:text-zinc-400">
                      {section.bullets.map((bullet, bIndex) => (
                        <li key={bIndex}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : null}

          {meta?.ctas?.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {meta.ctas.map((cta, index) => (
                <Link
                  key={index}
                  href={cta.href}
                  className={
                    cta.primary
                      ? "inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand/90"
                      : "inline-flex items-center justify-center rounded-xl border border-zinc-300 px-5 py-2.5 font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div id="modelle" className="scroll-mt-24 space-y-8">
          {hasInventory ? (
            <>
              <ListingFilters
                basePath={canonicalPath}
                filters={filters}
                sliderBounds={sliderBounds}
                filterOptions={filterOptions}
                categories={categories.map((category) => ({
                  slug: category.slug,
                  name: category.name,
                }))}
                showBrandFilter={false}
              />

              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
                  Zurzeit keine passenden {displayName}-Inserate. Passen Sie die
                  Filter an oder sehen Sie sich{" "}
                  <Link href="/anhaenger" className="font-medium text-brand underline dark:text-red-400">
                    alle Anhänger
                  </Link>{" "}
                  an.
                </p>
              ) : (
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((listing) => (
                    <li key={listing.id}>
                      <ListingCard listing={listing} mode="kauf" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            // Kein Bestand: Filter/Grid ausblenden, stattdessen Anfrage-Hinweis —
            // hält die Seite nützlich (Lead statt leerer Übersicht/Soft-404).
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                Aktuell haben wir keine {displayName}-Anhänger im Bestand.
              </p>
              <p className="mx-auto mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
                Wir beschaffen {displayName}-Anhänger deutschlandweit auf Anfrage.
                Sagen Sie uns, welches Modell Sie suchen — wir melden uns mit einem
                passenden Angebot.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand/90"
                >
                  {displayName} anfragen
                </Link>
                <Link
                  href="/anhaenger"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-5 py-2.5 font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Alle Anhänger ansehen
                </Link>
              </div>
            </div>
          )}
        </div>

        {faq.length ? (
          <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Häufige Fragen zu {displayName} Anhängern
            </h2>
            <dl className="mt-6 max-w-3xl space-y-6">
              {faq.map((item, index) => (
                <div key={index}>
                  <dt className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.question}
                  </dt>
                  <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </ContentContainer>
  );
}
