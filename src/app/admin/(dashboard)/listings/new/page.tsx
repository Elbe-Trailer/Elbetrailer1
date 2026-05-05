import { requireAdmin } from "@/lib/auth/admin";
import {
  normalizeAccessoriesForListingConfig,
  type RawAccessoryForListingRow,
} from "@/lib/accessoryListingConfig";
import ListingForm from "../ListingForm";

export default async function NewListingPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: accessories }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase
      .from("accessories")
      .select(
        "id, name, article_number, brand, category_id, accessory_categories(id, name, sort_order, allows_multiple)",
      )
      .eq("active", true)
      .order("name"),
  ]);

  const accessoriesForForm = normalizeAccessoriesForListingConfig(
    accessories as RawAccessoryForListingRow[] | null,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Neues Inserat
      </h1>
      <ListingForm
        categories={categories ?? []}
        accessories={accessoriesForForm}
      />
    </div>
  );
}
