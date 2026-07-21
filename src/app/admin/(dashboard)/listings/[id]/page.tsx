import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { listingPublicPath } from "@/lib/listing-url";
import {
  normalizeAccessoriesForListingConfig,
  type RawAccessoryForListingRow,
} from "@/lib/accessoryListingConfig";
import type { Listing, ListingCost } from "@/types/database";
import PriceIncreasePanel from "@/components/admin/PriceIncreasePanel";
import { deleteListing } from "../actions";
import ListingForm from "../ListingForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!listing) notFound();

  const [{ data: categories }, { data: accessories }, { data: la }, { data: cost }] =
    await Promise.all([
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase
        .from("accessories")
        .select(
          "id, name, article_number, brand, category_id, accessory_categories(id, name, sort_order, allows_multiple)",
        )
        .order("name"),
      supabase
        .from("listing_accessories")
        .select("accessory_id, max_quantity")
        .eq("listing_id", id),
      supabase
        .from("listing_costs")
        .select("*")
        .eq("listing_id", id)
        .maybeSingle(),
    ]);

  const l = listing as Listing;
  const accessoriesForForm = normalizeAccessoriesForListingConfig(
    accessories as RawAccessoryForListingRow[] | null,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Inserat bearbeiten
        </h1>
        <Link
          href={listingPublicPath(l.slug)}
          className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          Öffentliche Ansicht
        </Link>
      </div>

      <ListingForm
        listing={l}
        linked={la ?? []}
        categories={categories ?? []}
        accessories={accessoriesForForm}
        currentGalleryPaths={l.gallery_paths ?? []}
        cost={(cost as ListingCost | null) ?? null}
      />

      <PriceIncreasePanel
        kind="listing"
        id={id}
        currentVkCents={l.price_cents}
        currentEkNetCents={
          (cost as ListingCost | null)?.purchase_price_net_cents ?? null
        }
      />

      <form action={deleteListing} className="border-t border-red-200 pt-8 dark:border-red-900">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="text-sm text-red-600 hover:underline dark:text-red-400"
          formNoValidate
        >
          Inserat löschen
        </button>
      </form>
    </div>
  );
}
