import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import AccessoriesAdminTable from "./AccessoriesAdminTable";

export default async function AdminAccessoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: rows }, { data: accessoryCategories }, { data: usageRows }] =
    await Promise.all([
      supabase
        .from("accessories")
        .select(
          "id, name, brand, article_number, price_adjustment_cents, active, category_id",
        )
        .order("name"),
      supabase
        .from("accessory_categories")
        .select("id, name")
        .order("sort_order", { ascending: true }),
      // Rückwärts-Zuordnung: welches Inserat verwendet welches Zubehör.
      supabase
        .from("listing_accessories")
        .select("accessory_id, listings(id, title)"),
    ]);

  // accessory_id → Liste der Inserate, die dieses Zubehör verwenden.
  const usageByAccessory: Record<string, { id: string; title: string }[]> = {};
  const listingsMap = new Map<string, string>();
  for (const row of usageRows ?? []) {
    const rel = (row as { listings: unknown }).listings;
    const listing = (Array.isArray(rel) ? rel[0] : rel) as
      | { id: string; title: string }
      | null
      | undefined;
    if (!listing?.id) continue;
    const accessoryId = (row as { accessory_id: string }).accessory_id;
    (usageByAccessory[accessoryId] ??= []).push({
      id: listing.id,
      title: listing.title,
    });
    listingsMap.set(listing.id, listing.title);
  }
  const listings = [...listingsMap.entries()]
    .map(([id, title]) => ({ id, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Zubehör
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/accessories/bulk"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Bulk-Upload (Excel)
          </Link>
          <Link
            href="/admin/accessories/new"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Neu
          </Link>
        </div>
      </div>

      <AccessoriesAdminTable
        rows={rows ?? []}
        accessoryCategories={accessoryCategories ?? []}
        usageByAccessory={usageByAccessory}
        listings={listings}
      />
    </div>
  );
}
