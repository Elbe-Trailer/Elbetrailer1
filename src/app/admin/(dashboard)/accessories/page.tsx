import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminAccessoriesPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("accessories")
    .select(
      "id, name, brand, article_number, price_adjustment_cents, active, accessory_categories(name)",
    )
    .order("name");

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

      {!rows?.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">Noch keine Einträge.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Marke</th>
              <th className="py-2">Art.-Nr.</th>
              <th className="py-2">Kategorie</th>
              <th className="py-2">Aufschlag</th>
              <th className="py-2">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2">{r.name}</td>
                <td className="py-2">{r.brand ?? "—"}</td>
                <td className="py-2">{r.article_number ?? "—"}</td>
                <td className="py-2">
                  {(
                    Array.isArray(r.accessory_categories)
                      ? r.accessory_categories[0]
                      : r.accessory_categories
                  )?.name ?? "—"}
                </td>
                <td className="py-2">
                  {(r.price_adjustment_cents / 100).toFixed(2)} €
                </td>
                <td className="py-2">{r.active ? "aktiv" : "inaktiv"}</td>
                <td className="py-2 text-right">
                  <Link
                    href={`/admin/accessories/${r.id}`}
                    className="text-amber-700 hover:underline dark:text-amber-400"
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
