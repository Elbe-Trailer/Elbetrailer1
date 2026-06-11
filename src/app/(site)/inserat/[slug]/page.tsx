import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { formatEurFromCents, formatMm } from "@/lib/format";
import { getPublishedListingByParam } from "@/lib/listings/public";
import { listingPublicPath } from "@/lib/listing-url";
import { resolveCustomerListingMode } from "@/lib/listingCustomerMode";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildListingProductSchema } from "@/lib/seo/listing-schema";
import { isUuid } from "@/lib/slug";
import { publicStorageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { AccessorySelection } from "@/types/database";
import type { ConfiguratorAccessory } from "./Configurator";
import InquiryForm from "./InquiryForm";
import ListingGallery from "./ListingGallery";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    ansicht?: string | string[];
    anfrage?: string | string[];
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: param } = await params;
  const supabase = await createClient();
  const listing = await getPublishedListingByParam(supabase, param);
  if (!listing) return { title: "Inserat" };

  const parts = [listing.title];
  if (listing.brand) parts.push(listing.brand);
  if (listing.price_cents != null) {
    parts.push(`ab ${formatEurFromCents(listing.price_cents)}`);
  } else if (listing.daily_rate_cents != null) {
    parts.push(`ab ${formatEurFromCents(listing.daily_rate_cents)} / Tag`);
  }

  const firstImage = listing.gallery_paths?.[0];
  const image = firstImage ? publicStorageUrl("listings", firstImage) : null;

  return buildPageMetadata({
    title: parts.join(" — "),
    description:
      listing.description?.slice(0, 160) ??
      `${listing.title} — Anhänger bei elbe-trailer anfragen.`,
    path: listingPublicPath(listing.slug),
    image,
  });
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { slug: param } = await params;
  const sp = await searchParams;
  const ansichtRaw = sp.ansicht;
  const inquiryRaw = sp.anfrage;
  const ansicht =
    typeof ansichtRaw === "string"
      ? ansichtRaw
      : Array.isArray(ansichtRaw)
        ? ansichtRaw[0]
        : undefined;
  const inquiryId =
    typeof inquiryRaw === "string"
      ? inquiryRaw
      : Array.isArray(inquiryRaw)
        ? inquiryRaw[0]
        : undefined;

  const supabase = await createClient();
  const listing = await getPublishedListingByParam(supabase, param);

  if (!listing) notFound();

  if (isUuid(param) && listing.slug) {
    permanentRedirect(listingPublicPath(listing.slug));
  }

  const id = listing.id;

  const customerMode = resolveCustomerListingMode(
    listing.listing_type as "kauf" | "miete" | "kauf_und_miete",
    ansicht,
  );
  let initialSelections: AccessorySelection[] = [];
  let initialStartDate: string | null = null;
  let initialEndDate: string | null = null;
  if (inquiryId) {
    const admin = await getOptionalAdmin();
    if (admin) {
      const { data: inquiry } = await admin.supabase
        .from("inquiries")
        .select("listing_id, accessory_selections, start_date, end_date")
        .eq("id", inquiryId)
        .maybeSingle();
      if (inquiry && inquiry.listing_id === listing.id) {
        initialSelections = Array.isArray(inquiry.accessory_selections)
          ? (inquiry.accessory_selections as AccessorySelection[])
          : [];
        initialStartDate = inquiry.start_date ?? null;
        initialEndDate = inquiry.end_date ?? null;
      }
    }
  }

  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", listing.category_id)
    .maybeSingle();

  const { data: la } = await supabase
    .from("listing_accessories")
    .select("accessory_id, max_quantity")
    .eq("listing_id", id);

  const accIds = la?.map((x) => x.accessory_id) ?? [];
  let accessories: ConfiguratorAccessory[] = [];
  let rentalUnitId: string | null = null;
  let minRentalDays = 1;
  let discountTiers: Array<{ min_days: number; discount_percent: number }> = [];
  let unavailableRanges: Array<{ start_date: string; end_date: string }> = [];
  const loadRentalFlowData = customerMode === "miete";

  const { data: rentalAccessoryCategory } = await supabase
    .from("accessory_categories")
    .select("id")
    .ilike("name", "mieten")
    .eq("is_active", true)
    .maybeSingle();
  const rentalAccessoryCategoryId = rentalAccessoryCategory?.id ?? null;

  if (accIds.length) {
    let accessoriesQuery = supabase
      .from("accessories")
      .select(
        "id, name, article_number, brand, description, price_adjustment_cents, image_path, active, category_id, accessory_categories(name, sort_order, allows_multiple)",
      )
      .in("id", accIds)
      .eq("active", true);

    if (loadRentalFlowData && rentalAccessoryCategoryId) {
      accessoriesQuery = accessoriesQuery.eq("category_id", rentalAccessoryCategoryId);
    }

    const { data: accsData } = await accessoriesQuery;
    const accs = (accsData ?? []).filter((row) => {
      if (!rentalAccessoryCategoryId) return true;
      const categoryId = (row as { category_id: string | null }).category_id;
      return loadRentalFlowData
        ? categoryId === rentalAccessoryCategoryId
        : categoryId !== rentalAccessoryCategoryId;
    });

    const maxMap = new Map(
      (la ?? []).map((r) => [r.accessory_id, r.max_quantity]),
    );
    accessories =
      (accs ?? [])
        .map((row) => {
          const a = row as {
            id: string;
            name: string;
            article_number: string | null;
            brand: string | null;
            description: string | null;
            category_id: string | null;
            price_adjustment_cents: number;
            image_path: string | null;
            active: boolean;
            accessory_categories?:
              | {
                  name?: string;
                  sort_order?: number;
                  allows_multiple?: boolean;
                }
              | {
                  name?: string;
                  sort_order?: number;
                  allows_multiple?: boolean;
                }[]
              | null;
          };
          const rawCat = a.accessory_categories;
          const c = Array.isArray(rawCat) ? rawCat[0] : rawCat;
          return {
            id: a.id,
            name: a.name,
            article_number: a.article_number,
            brand: a.brand,
            description: a.description,
            category_id: a.category_id,
            price_adjustment_cents: a.price_adjustment_cents,
            image_path: a.image_path,
            active: a.active,
            max_quantity: maxMap.get(a.id) ?? 1,
            category_allows_multiple: c?.allows_multiple !== false,
            category_sort_order: c?.sort_order ?? 10_000,
            category_display_name: c?.name ?? "Weitere Optionen",
          };
        })
        .filter((a) => a.active) ?? [];
  }

  if (loadRentalFlowData) {
    const { data: rentalUnit } = await supabase
      .from("rental_units")
      .select("id, min_rental_days, active")
      .eq("listing_id", id)
      .eq("active", true)
      .maybeSingle();

    if (rentalUnit) {
      rentalUnitId = rentalUnit.id;
      minRentalDays = rentalUnit.min_rental_days ?? 1;
      const { data: tiers } = await supabase
        .from("rental_discount_tiers")
        .select("min_days, discount_percent")
        .order("min_days", { ascending: true });
      discountTiers = tiers ?? [];
      if (discountTiers.length === 0) {
        const { data: fallbackPricing } = await supabase
          .from("rental_pricing_settings")
          .select("discount_from_days, discount_percent")
          .eq("id", true)
          .maybeSingle();
        if (
          fallbackPricing?.discount_from_days != null &&
          (fallbackPricing.discount_percent ?? 0) > 0
        ) {
          discountTiers = [
            {
              min_days: fallbackPricing.discount_from_days,
              discount_percent: fallbackPricing.discount_percent ?? 0,
            },
          ];
        }
      }

      const [{ data: blocks }, { data: bookings }] = await Promise.all([
        supabase
          .from("rental_calendar_blocks")
          .select("start_date, end_date")
          .eq("rental_unit_id", rentalUnit.id),
        supabase
          .from("rental_bookings")
          .select("start_date, end_date")
          .eq("rental_unit_id", rentalUnit.id)
          .eq("status", "confirmed"),
      ]);

      unavailableRanges = [...(blocks ?? []), ...(bookings ?? [])];
    }
  }

  const gallery: string[] = Array.isArray(listing.gallery_paths)
    ? (listing.gallery_paths as string[])
    : [];
  const imageUrls = gallery.map((path) => publicStorageUrl("listings", path));

  return (
    <ContentContainer>
    <JsonLd
      data={buildListingProductSchema(
        {
          slug: listing.slug,
          title: listing.title,
          brand: listing.brand,
          description: listing.description,
          price_cents: listing.price_cents,
          daily_rate_cents: listing.daily_rate_cents,
          listing_type: listing.listing_type as "kauf" | "miete" | "kauf_und_miete",
          gallery_paths: gallery,
        },
        imageUrls,
      )}
    />
    <div className="space-y-10">
      <nav className="text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Start
        </Link>
        {category ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/kategorie/${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {listing.title}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          {gallery.length ? (
            <ListingGallery gallery={gallery} title={listing.title} />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              Kein Bild
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {customerMode === "miete" ? "Miete" : "Kauf"}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
            {listing.title}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {customerMode === "miete"
              ? `${formatEurFromCents(listing.daily_rate_cents)} / Tag`
              : formatEurFromCents(listing.price_cents)}
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Marke</dt>
              <dd>{listing.brand ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Artikelnummer</dt>
              <dd>{listing.article_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Zustand</dt>
              <dd>{listing.condition ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Außenabmessungen (L x B)</dt>
              <dd>
                {formatMm(listing.exterior_length_mm)} x {formatMm(listing.exterior_width_mm)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Laderaumabmessungen (L x B)</dt>
              <dd>
                {formatMm(listing.loading_length_mm)} x {formatMm(listing.loading_width_mm)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Zulässiges Gesamtgewicht</dt>
              <dd>
                {listing.gross_weight_kg != null ? `${listing.gross_weight_kg} kg` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Nutzlast</dt>
              <dd>
                {listing.payload_kg != null ? `${listing.payload_kg} kg` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Eigengewicht</dt>
              <dd>
                {listing.empty_weight_kg != null ? `${listing.empty_weight_kg} kg` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Bereifung</dt>
              <dd>
                {listing.tire_size_inch != null ? `${listing.tire_size_inch}"` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Achsen</dt>
              <dd>{listing.axle_count ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Gebremst</dt>
              <dd>
                {listing.braked == null ? "—" : listing.braked ? "Ja" : "Nein"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Kipfunktion</dt>
              <dd>{listing.tip_function ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Beleuchtung</dt>
              <dd>{listing.lighting ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Auffahrrampen</dt>
              <dd>{listing.loading_ramps ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Ladefläche</dt>
              <dd>{listing.loading_area ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {listing.description ? (
        <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Beschreibung
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {listing.description}
          </p>
        </section>
      ) : null}

      <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Zubehör wählen & anfragen
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Wählen Sie passendes Zubehör und senden Sie uns eine unverbindliche
          Anfrage mit Ihren Kontaktdaten.
          {customerMode === "miete" && rentalUnitId
            ? ` Der Mietzeitraum ist verpflichtend (mindestens ${minRentalDays} Tag(e)).`
            : ""}
        </p>
        <div className="mt-8 max-w-2xl">
          <InquiryForm
            listingId={listing.id}
            accessories={accessories}
            basePriceCents={listing.price_cents}
            baseDailyCents={listing.daily_rate_cents}
            customerMode={customerMode}
            rentalUnitId={rentalUnitId}
            minRentalDays={minRentalDays}
            discountTiers={discountTiers}
            unavailableRanges={unavailableRanges}
            initialSelections={initialSelections}
            initialStartDate={initialStartDate}
            initialEndDate={initialEndDate}
          />
        </div>
      </section>
    </div>
    </ContentContainer>
  );
}
