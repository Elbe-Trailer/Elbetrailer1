import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import {
  saveRentalUnitAccessories,
  updateRentalAccessory,
} from "./actions";
import GlobalRentalDiscountForm from "./GlobalRentalDiscountForm";
import RentalUnitCreateForm from "./RentalUnitCreateForm";
import RentalAccessoriesManager from "./RentalAccessoriesManager";
import RentalAccessoryDeleteButton from "./RentalAccessoryDeleteButton";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function AdminRentalsPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: rentalCategory } = await supabase
    .from("accessory_categories")
    .select("id")
    .ilike("name", "mieten")
    .eq("is_active", true)
    .maybeSingle();

  const [{ data: rentalUnits }, { data: rentalListings }, { data: rentalAccessories }] =
    await Promise.all([
    supabase
      .from("rental_units")
      .select(
        "id, active, min_rental_days, listing_id, created_at, listings ( title, published )",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select("id, title")
      .in("listing_type", ["miete", "kauf_und_miete"])
      .order("created_at", { ascending: false }),
    rentalCategory?.id
      ? supabase
          .from("accessories")
          .select("id, name, description, price_adjustment_cents, active")
          .eq("category_id", rentalCategory.id)
          .order("name")
      : Promise.resolve({ data: [] }),
    ]);
  const { data: discountTiers } = await supabase
    .from("rental_discount_tiers")
    .select("min_days, discount_percent")
    .order("min_days", { ascending: true });
  const listingIds = (rentalUnits ?? []).map((unit) => unit.listing_id);
  const { data: linkedAccessories } = listingIds.length
    ? await supabase
        .from("listing_accessories")
        .select("listing_id, accessory_id, max_quantity")
        .in("listing_id", listingIds)
    : { data: [] };

  const linkedByListing = new Map<
    string,
    Array<{ accessory_id: string; max_quantity: number }>
  >();
  for (const row of linkedAccessories ?? []) {
    const existing = linkedByListing.get(row.listing_id) ?? [];
    existing.push({
      accessory_id: row.accessory_id,
      max_quantity: row.max_quantity,
    });
    linkedByListing.set(row.listing_id, existing);
  }

  const usedListingIds = new Set((rentalUnits ?? []).map((r) => r.listing_id));
  const availableListings = (rentalListings ?? []).filter(
    (l) => !usedListingIds.has(l.id),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Anhänger mieten
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Mietobjekte aus bestehenden Inseraten auswählen und verwalten.
        </p>
      </div>

      {error === "delete-accessory-forbidden" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Dieses Zubehör gehört nicht zum Miet-Zubehör und kann hier nicht
          gelöscht werden.
        </p>
      ) : null}
      {error === "delete-failed" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Zubehör konnte nicht gelöscht werden.
        </p>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Mietobjekt anlegen
        </h2>
        {!availableListings.length ? (
          <p className="mt-2 text-sm text-zinc-500">
            Alle Miet-Inserate sind bereits als Mietobjekt angelegt.
          </p>
        ) : (
          <RentalUnitCreateForm listings={availableListings} />
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Miet-Zubehör (Tagessatz)
        </h2>
        <p className="text-sm text-zinc-500">
          Dieses Zubehör wird im Miet-Konfigurator verwendet und pro Tag zum
          Gesamtpreis addiert.
        </p>
        <RentalAccessoriesManager />
        {!rentalAccessories?.length ? (
          <p className="text-sm text-zinc-500">Noch kein Miet-Zubehör angelegt.</p>
        ) : (
          <div className="space-y-2">
            {rentalAccessories.map((accessory) => (
              <form
                key={accessory.id}
                action={updateRentalAccessory}
                className="grid gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700 sm:grid-cols-12"
              >
                <input type="hidden" name="id" value={accessory.id} />
                <input
                  name="name"
                  defaultValue={accessory.name}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-3"
                />
                <input
                  name="daily_rate_eur"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={(accessory.price_adjustment_cents / 100).toFixed(2)}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-2"
                />
                <input
                  name="description"
                  defaultValue={accessory.description ?? ""}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950 sm:col-span-4"
                />
                <label className="inline-flex items-center gap-2 text-xs sm:col-span-1">
                  <input type="checkbox" name="active" defaultChecked={accessory.active} />
                  Aktiv
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded bg-zinc-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-zinc-900"
                  >
                    Speichern
                  </button>
                  <RentalAccessoryDeleteButton />
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Bestehende Mietobjekte
        </h2>
        {!rentalUnits?.length ? (
          <p className="text-zinc-500">Noch keine Mietobjekte vorhanden.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Inserat</th>
                  <th className="px-4 py-3 font-medium">Aktiv</th>
                  <th className="px-4 py-3 font-medium">Mindesttage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rentalUnits.map((unit) => {
                  const joined = unit.listings;
                  const listingData =
                    joined && typeof joined === "object"
                      ? Array.isArray(joined)
                        ? (joined[0] as
                            | { title: string; published: boolean }
                            | undefined) ?? null
                        : (joined as { title: string; published: boolean })
                      : null;
                  return (
                    <tr
                      key={unit.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3">{listingData?.title ?? "—"}</td>
                      <td className="px-4 py-3">
                        {unit.active ? "ja" : "nein"}
                      </td>
                      <td className="px-4 py-3">{unit.min_rental_days}</td>
                      <td className="px-4 py-3">
                        {listingData?.published ? "veröffentlicht" : "Entwurf"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/rentals/${unit.id}`}
                          className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                        >
                          Kalender & Buchungen
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Miet-Zubehör je Mietinserat
        </h2>
        <p className="text-sm text-zinc-500">
          Hier wählen Sie direkt pro Mietobjekt, welches Miet-Zubehör im
          Inserat-Konfigurator verfügbar ist.
        </p>
        {!rentalUnits?.length ? (
          <p className="text-sm text-zinc-500">Noch keine Mietobjekte vorhanden.</p>
        ) : !rentalAccessories?.length ? (
          <p className="text-sm text-zinc-500">
            Noch kein Miet-Zubehör angelegt. Bitte oben zuerst Miet-Zubehör
            erstellen.
          </p>
        ) : (
          <div className="space-y-4">
            {rentalUnits.map((unit) => {
              const joinedB = unit.listings;
              const listingData =
                joinedB && typeof joinedB === "object"
                  ? Array.isArray(joinedB)
                    ? (joinedB[0] as { title: string } | undefined) ?? null
                    : (joinedB as { title: string })
                  : null;
              const linkMap = new Map(
                (linkedByListing.get(unit.listing_id) ?? []).map((entry) => [
                  entry.accessory_id,
                  entry.max_quantity,
                ]),
              );

              return (
                <form
                  key={unit.id}
                  action={saveRentalUnitAccessories}
                  className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <input type="hidden" name="admin_context" value="rentals-list" />
                  <input type="hidden" name="rental_unit_id" value={unit.id} />
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {listingData?.title ?? "Mietobjekt"}
                  </p>
                  <ul className="space-y-2">
                    {rentalAccessories.map((accessory) => (
                      <li key={accessory.id} className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="accessory"
                            value={accessory.id}
                            defaultChecked={linkMap.has(accessory.id)}
                          />
                          {accessory.name} (
                          {(accessory.price_adjustment_cents / 100).toFixed(2)} €/Tag)
                        </label>
                        <label className="flex items-center gap-1 text-xs text-zinc-500">
                          max.
                          <input
                            name={`max_${accessory.id}`}
                            type="number"
                            min="1"
                            defaultValue={linkMap.get(accessory.id) ?? 1}
                            className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-950"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="submit"
                    className="rounded bg-zinc-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-zinc-900"
                  >
                    Zubehör für Mietobjekt speichern
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Globale Rabattierung (alle Mietinserate)
        </h2>
        <p className="text-sm text-zinc-500">
          Diese Staffel gilt automatisch bei allen Mietanfragen und Buchungen.
        </p>
        <GlobalRentalDiscountForm tiers={discountTiers ?? []} />
      </section>
    </div>
  );
}
