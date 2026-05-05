import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminListingsPage() {
  const { supabase } = await requireAdmin();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, listing_type, published, price_cents, daily_rate_cents, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Inserate
        </h1>
        <Link
          href="/admin/listings/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Neues Inserat
        </Link>
      </div>

      {!listings?.length ? (
        <p className="text-zinc-600 dark:text-zinc-400">Noch keine Inserate.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Titel</th>
                <th className="px-4 py-3 font-medium">Art</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">{l.title}</td>
                  <td className="px-4 py-3">
                    {l.listing_type === "miete"
                      ? "Miete"
                      : l.listing_type === "kauf_und_miete"
                        ? "Kauf + Miete"
                        : "Kauf"}
                  </td>
                  <td className="px-4 py-3">
                    {l.published ? (
                      <span className="text-emerald-600">veröffentlicht</span>
                    ) : (
                      <span className="text-zinc-500">Entwurf</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/listings/${l.id}`}
                      className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
