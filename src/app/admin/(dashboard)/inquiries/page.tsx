import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminInquiriesPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("inquiries")
    .select(
      "id, name, email, phone, message, accessory_selections, start_date, end_date, rental_unit_id, created_at, listings ( title )",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Anfragen
      </h1>

      {!rows?.length ? (
        <p className="text-zinc-500">Noch keine Anfragen.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => {
            const listingTitle =
              r.listings &&
              typeof r.listings === "object" &&
              "title" in r.listings
                ? String((r.listings as { title: string }).title)
                : "—";
            const selections = Array.isArray(r.accessory_selections)
              ? (r.accessory_selections as { accessory_id: string; quantity: number }[])
              : [];
            return (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <a className="underline" href={`mailto:${r.email}`}>
                        {r.email}
                      </a>
                      {r.phone ? ` · ${r.phone}` : null}
                    </p>
                  </div>
                  <time
                    className="text-xs text-zinc-500"
                    dateTime={r.created_at}
                  >
                    {new Date(r.created_at).toLocaleString("de-DE")}
                  </time>
                </div>
                <p className="mt-2 text-sm">
                  <span className="text-zinc-500">Inserat:</span> {listingTitle}
                </p>
                {r.start_date && r.end_date ? (
                  <p className="mt-1 text-sm">
                    <span className="text-zinc-500">Mietzeitraum:</span>{" "}
                    {r.start_date} bis {r.end_date}
                    {r.rental_unit_id ? (
                      <>
                        {" · "}
                        <a
                          className="underline"
                          href={`/admin/rentals/${r.rental_unit_id}`}
                        >
                          Kalender öffnen
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
                {r.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {r.message}
                  </p>
                ) : null}
                {selections.length > 0 ? (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-zinc-600 dark:text-zinc-400">
                      Zubehör
                    </p>
                    <ul className="mt-1 list-inside list-disc">
                      {selections.map((s) => (
                        <li key={s.accessory_id}>
                          {s.accessory_id.slice(0, 8)}… × {s.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
