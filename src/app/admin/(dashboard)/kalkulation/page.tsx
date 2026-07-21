import { requireAdmin } from "@/lib/auth/admin";
import type { ListingType } from "@/types/database";
import KalkulationTool, {
  type KalkAccessory,
  type KalkLink,
  type KalkListing,
} from "./KalkulationTool";

export const metadata = { title: "Kalkulation" };

type RawCat = {
  name: string;
  sort_order: number;
  allows_multiple: boolean;
};

export default async function KalkulationPage() {
  const { supabase } = await requireAdmin();

  const [
    { data: listings },
    { data: links },
    { data: accessories },
    { data: listingCosts },
    { data: accessoryCosts },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, article_number, price_cents, daily_rate_cents, listing_type, published")
      .order("title"),
    supabase
      .from("listing_accessories")
      .select("listing_id, accessory_id, max_quantity"),
    supabase
      .from("accessories")
      .select(
        "id, name, brand, article_number, price_adjustment_cents, category_id, active, accessory_categories(name, sort_order, allows_multiple)",
      )
      .eq("active", true)
      .order("name"),
    supabase.from("listing_costs").select("listing_id, purchase_price_net_cents"),
    supabase
      .from("accessory_costs")
      .select("accessory_id, purchase_price_net_cents"),
  ]);

  const listingEk = new Map<string, number | null>(
    (listingCosts ?? []).map((c) => [
      c.listing_id as string,
      (c.purchase_price_net_cents as number | null) ?? null,
    ]),
  );
  const accessoryEk = new Map<string, number | null>(
    (accessoryCosts ?? []).map((c) => [
      c.accessory_id as string,
      (c.purchase_price_net_cents as number | null) ?? null,
    ]),
  );

  const toolListings: KalkListing[] = (listings ?? []).map((l) => ({
    id: l.id as string,
    title: String(l.title),
    article_number: (l.article_number as string | null) ?? null,
    price_cents: (l.price_cents as number | null) ?? null,
    daily_rate_cents: (l.daily_rate_cents as number | null) ?? null,
    listing_type: l.listing_type as ListingType,
    published: Boolean(l.published),
    ek_net_cents: listingEk.get(l.id as string) ?? null,
  }));

  const toolAccessories: KalkAccessory[] = (accessories ?? []).map((a) => {
    const rawCat = a.accessory_categories as RawCat | RawCat[] | null;
    const cat = Array.isArray(rawCat) ? (rawCat[0] ?? null) : rawCat;
    return {
      id: a.id as string,
      name: String(a.name),
      brand: (a.brand as string | null) ?? null,
      article_number: (a.article_number as string | null) ?? null,
      price_adjustment_cents:
        typeof a.price_adjustment_cents === "number" ? a.price_adjustment_cents : 0,
      category_id: (a.category_id as string | null) ?? null,
      category_name: cat?.name ?? "Ohne Kategorie",
      category_sort: cat?.sort_order ?? 10_000,
      allows_multiple: cat?.allows_multiple !== false,
      ek_net_cents: accessoryEk.get(a.id as string) ?? null,
    };
  });

  const toolLinks: KalkLink[] = (links ?? []).map((row) => ({
    listing_id: row.listing_id as string,
    accessory_id: row.accessory_id as string,
    max_quantity: Math.max(1, Number(row.max_quantity) || 1),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Kalkulation
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Anhänger intern konfigurieren und Einkaufs- und Verkaufspreise
          gegenüberstellen — für individuelle Angebote.
        </p>
      </div>
      <KalkulationTool
        listings={toolListings}
        accessories={toolAccessories}
        links={toolLinks}
      />
    </div>
  );
}
