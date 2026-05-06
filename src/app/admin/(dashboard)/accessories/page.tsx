import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import AccessoriesAdminTable from "./AccessoriesAdminTable";

export default async function AdminAccessoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: rows }, { data: accessoryCategories }] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Zubehör
        </h1>
        <Link
          href="/admin/accessories/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Neu
        </Link>
      </div>

      <AccessoriesAdminTable
        rows={rows ?? []}
        accessoryCategories={accessoryCategories ?? []}
      />
    </div>
  );
}
