import ContentContainer from "@/components/ContentContainer";
import ListingCard from "@/components/ListingCard";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

export default async function MietenPage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price_cents, daily_rate_cents, listing_type, gallery_paths",
    )
    .eq("published", true)
    .in("listing_type", ["miete", "kauf_und_miete"])
    .order("created_at", { ascending: false });

  const list = (listings ?? []) as Pick<
    Listing,
    | "id"
    | "title"
    | "price_cents"
    | "daily_rate_cents"
    | "listing_type"
    | "gallery_paths"
  >[];

  return (
    <ContentContainer>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Anhänger mieten
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Übersicht aller veröffentlichten Miet-Inserate. Tages- oder
          Wochenpreise entnehmen Sie den Detailseiten — Anfragen sind
          unverbindlich.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
          Aktuell keine Miet-Angebote.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((listing) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                mode="miete"
                detailQuery="?ansicht=miete"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
    </ContentContainer>
  );
}
