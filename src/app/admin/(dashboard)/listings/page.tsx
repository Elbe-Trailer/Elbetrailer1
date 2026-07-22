import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import ListingsAdminTable from "./ListingsAdminTable";

export default async function AdminListingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: listings }, { data: categories }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, title, listing_type, published, price_cents, daily_rate_cents, brand, article_number, category_id, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Inserate
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/listings/bulk"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Bulk-Upload (Excel)
          </Link>
          <Link
            href="/admin/listings/new"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Neues Inserat
          </Link>
        </div>
      </div>

      <ListingsAdminTable
        listings={listings ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
