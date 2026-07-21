import { requireAdmin } from "@/lib/auth/admin";
import BulkPriceTool, {
  type BulkCategory,
  type BulkItem,
} from "./BulkPriceTool";

export const metadata = { title: "Preise" };

export default async function PreisePage() {
  const { supabase } = await requireAdmin();

  const [
    { data: accessories },
    { data: accessoryCategories },
    { data: listings },
    { data: listingCosts },
    { data: accessoryCosts },
  ] = await Promise.all([
    supabase
      .from("accessories")
      .select("id, name, brand, article_number, price_adjustment_cents, category_id, active")
      .order("name"),
    supabase.from("accessory_categories").select("id, name").order("sort_order"),
    supabase
      .from("listings")
      .select("id, title, brand, article_number, price_cents, published")
      .order("title"),
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

  const accessoryItems: BulkItem[] = (accessories ?? []).map((a) => ({
    kind: "accessory" as const,
    id: a.id as string,
    name: String(a.name),
    brand: (a.brand as string | null) ?? null,
    article_number: (a.article_number as string | null) ?? null,
    category_id: (a.category_id as string | null) ?? null,
    vk_cents:
      typeof a.price_adjustment_cents === "number" ? a.price_adjustment_cents : 0,
    ek_net_cents: accessoryEk.get(a.id as string) ?? null,
    inactive: a.active === false,
  }));

  const listingItems: BulkItem[] = (listings ?? []).map((l) => ({
    kind: "listing" as const,
    id: l.id as string,
    name: String(l.title),
    brand: (l.brand as string | null) ?? null,
    article_number: (l.article_number as string | null) ?? null,
    category_id: null,
    vk_cents: (l.price_cents as number | null) ?? null,
    ek_net_cents: listingEk.get(l.id as string) ?? null,
    inactive: l.published === false,
  }));

  const categories: BulkCategory[] = (accessoryCategories ?? []).map((c) => ({
    id: c.id as string,
    name: String(c.name),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Preise
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Einkaufs- und Verkaufspreise für mehrere Einträge auf einmal anpassen —
          z. B. bei Preiserhöhungen eines Lieferanten.
        </p>
      </div>
      <BulkPriceTool
        accessories={accessoryItems}
        listings={listingItems}
        accessoryCategories={categories}
      />
    </div>
  );
}
