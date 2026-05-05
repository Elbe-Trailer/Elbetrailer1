import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/ContentContainer";
import { createClient } from "@/lib/supabase/server";
import { formatEurFromCents, formatMm } from "@/lib/format";
import { publicStorageUrl } from "@/lib/storage";
import { resolveCustomerListingMode } from "@/lib/listingCustomerMode";
import type { ConfiguratorAccessory } from "./Configurator";
import InquiryForm from "./InquiryForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ansicht?: string | string[] }>;
};

export default async function ListingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const ansichtRaw = sp.ansicht;
  const ansicht =
    typeof ansichtRaw === "string"
      ? ansichtRaw
      : Array.isArray(ansichtRaw)
        ? ansichtRaw[0]
        : undefined;

  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, article_number, brand, description, price_cents, daily_rate_cents, condition, exterior_length_mm, exterior_width_mm, loading_length_mm, loading_width_mm, gross_weight_kg, payload_kg, empty_weight_kg, tire_size_inch, axle_count, braked, tip_function, lighting, loading_ramps, loading_area, length_mm, width_mm, height_mm, category_id, listing_type, published, gallery_paths, created_at",
    )
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!listing) notFound();

  const customerMode = resolveCustomerListingMode(
    listing.listing_type as "kauf" | "miete" | "kauf_und_miete",
    ansicht,
  );

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
  let unavailableRanges: Array<{ start_date: string; end_date: string }> = [];
  const loadRentalFlowData = customerMode === "miete";

  let rentalAccessoryCategoryId: string | null = null;
  if (loadRentalFlowData) {
    const { data: rentalAccessoryCategory } = await supabase
      .from("accessory_categories")
      .select("id")
      .ilike("name", "mieten")
      .eq("is_active", true)
      .maybeSingle();
    rentalAccessoryCategoryId = rentalAccessoryCategory?.id ?? null;
  }

  if (accIds.length) {
    const shouldLoadRentalAccessories =
      !loadRentalFlowData || rentalAccessoryCategoryId !== null;
    let accs: unknown[] = [];
    if (shouldLoadRentalAccessories) {
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

      const { data } = await accessoriesQuery;
      accs = data ?? [];
    }

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

      const [{ data: blocks }, { data: bookings }] = await Promise.all([
        supabase
          .from("rental_calendar_blocks")
          .select("start_date, end_date")
          .eq("rental_unit_id", rentalUnit.id),
        supabase
          .from("rental_bookings")
          .select("start_date, end_date")
          .eq("rental_unit_id", rentalUnit.id)
          .in("status", ["pending", "confirmed"]),
      ]);

      unavailableRanges = [...(blocks ?? []), ...(bookings ?? [])];
    }
  }

  const gallery: string[] = Array.isArray(listing.gallery_paths)
    ? (listing.gallery_paths as string[])
    : [];

  return (
    <ContentContainer>
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
            <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={publicStorageUrl("listings", gallery[0])}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width:1024px) 100vw, 50vw"
                  unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                />
              </div>
              {gallery.length > 1 ? (
                <div className="grid grid-cols-4 gap-2">
                  {gallery.slice(1).map((path) => (
                    <div
                      key={path}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                    >
                      <Image
                        src={publicStorageUrl("listings", path)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
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
            unavailableRanges={unavailableRanges}
          />
        </div>
      </section>
    </div>
    </ContentContainer>
  );
}
