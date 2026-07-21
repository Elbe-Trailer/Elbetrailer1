import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
} from "@/lib/seo/listing-schema";
import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
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
  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!cat) return { title: "Kategorie" };
  return buildPageMetadata({
    title: `${cat.name} kaufen`,
    description: `${cat.name} kaufen — Inserate, Filter und technische Daten bei elbe-trailer.`,
    path: `/kategorie/${slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const filters = parseListingFilters(sp);
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!cat) notFound();

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: optionsData } = await supabase
    .from("listings")
    .select(
      "brand, loading_area, tip_function, lighting, loading_ramps, axle_count, tire_size_inch, gross_weight_kg, payload_kg, empty_weight_kg, exterior_length_mm, exterior_width_mm, loading_length_mm, loading_width_mm, price_cents",
    )
    .eq("category_id", cat.id)
    .eq("published", true)
    .in("listing_type", ["kauf", "kauf_und_miete"]);

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

  const ceilToStep = (value: number, step: number) =>
    Math.ceil(value / step) * step;
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
    .eq("category_id", cat.id)
    .eq("published", true)
    .in("listing_type", ["kauf", "kauf_und_miete"]);

  if (filters.brand.length) query = query.in("brand", filters.brand);
  if (filters.priceMin !== null) query = query.gte("price_cents", filters.priceMin * 100);
  if (filters.priceMax !== null) query = query.lte("price_cents", filters.priceMax * 100);
  if (filters.braked !== null) query = query.eq("braked", filters.braked);
  if (filters.loadingArea.length) query = query.in("loading_area", filters.loadingArea);
  if (filters.tipFunction.length) query = query.in("tip_function", filters.tipFunction);
  if (filters.lighting.length) query = query.in("lighting", filters.lighting);
  if (filters.loadingRamps.length) query = query.in("loading_ramps", filters.loadingRamps);
  if (filters.grossWeightMin !== null) {
    query = query.gte("gross_weight_kg", filters.grossWeightMin);
  }
  if (filters.grossWeightMax !== null) {
    query = query.lte("gross_weight_kg", filters.grossWeightMax);
  }
  if (filters.payloadMin !== null) query = query.gte("payload_kg", filters.payloadMin);
  if (filters.payloadMax !== null) query = query.lte("payload_kg", filters.payloadMax);
  if (filters.emptyWeightMin !== null) {
    query = query.gte("empty_weight_kg", filters.emptyWeightMin);
  }
  if (filters.emptyWeightMax !== null) {
    query = query.lte("empty_weight_kg", filters.emptyWeightMax);
  }
  if (filters.exteriorLengthMin !== null) {
    query = query.gte("exterior_length_mm", filters.exteriorLengthMin);
  }
  if (filters.exteriorLengthMax !== null) {
    query = query.lte("exterior_length_mm", filters.exteriorLengthMax);
  }
  if (filters.exteriorWidthMin !== null) {
    query = query.gte("exterior_width_mm", filters.exteriorWidthMin);
  }
  if (filters.exteriorWidthMax !== null) {
    query = query.lte("exterior_width_mm", filters.exteriorWidthMax);
  }
  if (filters.loadingLengthMin !== null) {
    query = query.gte("loading_length_mm", filters.loadingLengthMin);
  }
  if (filters.loadingLengthMax !== null) {
    query = query.lte("loading_length_mm", filters.loadingLengthMax);
  }
  if (filters.loadingWidthMin !== null) {
    query = query.gte("loading_width_mm", filters.loadingWidthMin);
  }
  if (filters.loadingWidthMax !== null) {
    query = query.lte("loading_width_mm", filters.loadingWidthMax);
  }
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
  const { data: listings } = await query.order(sortOrder.column, {
    ascending: sortOrder.ascending,
    nullsFirst: sortOrder.nullsFirst,
  });

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

  return (
    <ContentContainer>
    <JsonLd
      data={[
        buildBreadcrumbSchema([
          { name: "Start", url: absoluteUrl("/") },
          { name: "Anhänger kaufen", url: absoluteUrl("/anhaenger") },
          { name: cat.name, url: absoluteUrl(`/kategorie/${cat.slug}`) },
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
          <span>{cat.name}</span>
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
          {cat.name} kaufen
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Alle aktuellen Kauf-Inserate in dieser Kategorie. Für Miet-Angebote
          nutzen Sie den Menüpunkt{" "}
          <Link href="/mieten" className="font-medium text-brand underline dark:text-red-400">
            Mieten
          </Link>
          .
        </p>
      </div>

      <ListingFilters
        basePath={`/kategorie/${cat.slug}`}
        filters={filters}
        sliderBounds={sliderBounds}
        filterOptions={filterOptions}
        categories={(categoriesData ?? []).map((category) => ({
          slug: category.slug,
          name: category.name,
        }))}
        showCategoryFilter={false}
      />

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
          Zurzeit keine Inserate in dieser Kategorie.
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
    </div>
    </ContentContainer>
  );
}
