import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import StorageImage from "@/components/StorageImage";
import { deleteHighlight, setHighlight } from "./actions";

export default async function AdminHighlightsPage() {
  const { supabase } = await requireAdmin();

  const { data: highlights } = await supabase
    .from("listing_highlights")
    .select("listing_id, position")
    .order("position", { ascending: true });

  const ids = highlights?.map((h) => h.listing_id) ?? [];
  let listingsMap = new Map<
    string,
    { title: string; gallery_paths: string[] | null }
  >();
  if (ids.length) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, gallery_paths")
      .in("id", ids);
    listingsMap = new Map(
      (listings ?? []).map((l) => [
        l.id as string,
        {
          title: l.title as string,
          gallery_paths: l.gallery_paths as string[] | null,
        },
      ]),
    );
  }

  const { data: allPublished } = await supabase
    .from("listings")
    .select("id, title")
    .eq("published", true)
    .order("title");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Portfolio (Startseite)
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Wählen Sie veröffentlichte Inserate und eine Reihenfolge (0 = zuerst).
      </p>

      <form action={setHighlight} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="listing_id">
            Inserat
          </label>
          <select
            id="listing_id"
            name="listing_id"
            required
            className="min-w-[240px] rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">— wählen —</option>
            {(allPublished ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="position">
            Position
          </label>
          <input
            id="position"
            name="position"
            type="number"
            min={0}
            defaultValue={0}
            className="w-24 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Hinzufügen / aktualisieren
        </button>
      </form>

      <ul className="space-y-4">
        {(highlights ?? []).map((h) => {
          const li = listingsMap.get(h.listing_id);
          const thumb = li?.gallery_paths?.[0];
          return (
            <li
              key={h.listing_id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <span className="w-8 font-mono text-sm text-zinc-500">
                {h.position}
              </span>
              {thumb ? (
                <div className="relative h-14 w-20 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  <StorageImage
                    bucket="listings"
                    path={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="h-14 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
              )}
              <div className="flex-1">
                <p className="font-medium">{li?.title ?? h.listing_id}</p>
                <Link
                  href={`/admin/listings/${h.listing_id}`}
                  className="text-sm text-amber-700 hover:underline dark:text-amber-400"
                >
                  Inserat bearbeiten
                </Link>
              </div>
              <form action={deleteHighlight}>
                <input type="hidden" name="listing_id" value={h.listing_id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Entfernen
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      {!highlights?.length ? (
        <p className="text-zinc-500">Noch keine Highlights.</p>
      ) : null}
    </div>
  );
}
