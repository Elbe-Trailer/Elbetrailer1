import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { formatEurFromCents } from "@/lib/format";
import { calculateRentalPrice } from "@/lib/rentalPricing";
import RentalCalendarManager from "./RentalCalendarManager";
import RentalUnitSettingsForm from "./RentalUnitSettingsForm";
import {
  deleteCalendarBlock,
  saveRentalUnitAccessories,
  updateBookingStatus,
} from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminRentalDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: rentalUnit } = await supabase
    .from("rental_units")
    .select(
      "id, listing_id, active, min_rental_days, listings ( id, title, daily_rate_cents )",
    )
    .eq("id", id)
    .maybeSingle();

  if (!rentalUnit) notFound();

  const [{ data: blocks }, { data: bookings }] = await Promise.all([
    supabase
      .from("rental_calendar_blocks")
      .select("id, start_date, end_date, reason, created_at")
      .eq("rental_unit_id", id)
      .order("start_date", { ascending: true }),
    supabase
      .from("rental_bookings")
      .select(
        "id, status, start_date, end_date, customer_name, customer_email, customer_phone, customer_message, created_at, inquiries ( accessory_selections )",
      )
      .eq("rental_unit_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const { data: globalDiscountTiers } = await supabase
    .from("rental_discount_tiers")
    .select("min_days, discount_percent")
    .order("min_days", { ascending: true });

  const { data: rentalCategory } = await supabase
    .from("accessory_categories")
    .select("id")
    .ilike("name", "mieten")
    .eq("is_active", true)
    .maybeSingle();

  const [rentalAccessoriesRes, linkedAccessoriesRes] = await Promise.all([
    rentalCategory?.id
      ? supabase
          .from("accessories")
          .select("id, name, price_adjustment_cents, active")
          .eq("category_id", rentalCategory.id)
          .eq("active", true)
          .order("name")
      : Promise.resolve({ data: [] }),
    supabase
      .from("listing_accessories")
      .select("accessory_id, max_quantity")
      .eq("listing_id", rentalUnit.listing_id),
  ]);

  const rentalAccessories = rentalAccessoriesRes.data ?? [];
  const linkedAccessories = linkedAccessoriesRes.data ?? [];
  const linkedMap = new Map(
    linkedAccessories.map((item) => [item.accessory_id, item.max_quantity]),
  );

  const joinedListings = rentalUnit.listings;
  const listing =
    joinedListings && typeof joinedListings === "object"
      ? Array.isArray(joinedListings)
        ? (joinedListings[0] as
            | { id: string; title: string; daily_rate_cents?: number | null }
            | undefined) ??
          null
        : (joinedListings as {
            id: string;
            title: string;
            daily_rate_cents?: number | null;
          })
      : null;
  const selectedAccessoryIds = Array.from(
    new Set(
      (bookings ?? []).flatMap((booking) => {
        const inquiry = booking.inquiries;
        const selections =
          inquiry && typeof inquiry === "object" && "accessory_selections" in inquiry
            ? (inquiry as {
                accessory_selections?: Array<{ accessory_id: string; quantity: number }>;
              }).accessory_selections
            : [];
        return Array.isArray(selections)
          ? selections.map((selection) => selection.accessory_id)
          : [];
      }),
    ),
  );
  const accessoryDailyById = new Map<string, number>();
  if (selectedAccessoryIds.length > 0) {
    const { data: selectedAccessories } = await supabase
      .from("accessories")
      .select("id, price_adjustment_cents")
      .in("id", selectedAccessoryIds);
    for (const accessory of selectedAccessories ?? []) {
      accessoryDailyById.set(
        String(accessory.id),
        typeof accessory.price_adjustment_cents === "number"
          ? accessory.price_adjustment_cents
          : 0,
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/rentals"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Zurück zu Anhänger mieten
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
            {listing?.title ?? "Mietobjekt"}
          </h1>
          {listing ? (
            <p className="mt-1 text-sm text-zinc-500">
              Basis-Inserat:{" "}
              <Link className="underline" href={`/admin/listings/${listing.id}`}>
                Inserat öffnen
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Mietobjekt-Einstellungen
        </h2>
        <div className="mt-4">
          <RentalUnitSettingsForm
            rentalUnitId={rentalUnit.id}
            active={rentalUnit.active}
            minRentalDays={rentalUnit.min_rental_days}
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Buchungskalender pflegen
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Hier können Zeiträume manuell blockiert werden.
        </p>
        <div className="mt-4">
          <RentalCalendarManager
            rentalUnitId={id}
            blocks={blocks ?? []}
            bookings={(bookings ?? []).map((booking) => ({
              id: booking.id,
              status: booking.status,
              start_date: booking.start_date,
              end_date: booking.end_date,
            }))}
          />
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="font-medium text-zinc-900 dark:text-white">
            Blockierte Zeiträume
          </h3>
          {!blocks?.length ? (
            <p className="text-sm text-zinc-500">Keine Blockierungen vorhanden.</p>
          ) : (
            <ul className="space-y-2">
              {blocks.map((block) => (
                <li
                  key={block.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">{block.start_date}</span> bis{" "}
                      <span className="font-medium">{block.end_date}</span>
                    </p>
                    {block.reason ? (
                      <p className="text-zinc-500">{block.reason}</p>
                    ) : null}
                  </div>
                  <form action={deleteCalendarBlock}>
                    <input type="hidden" name="id" value={block.id} />
                    <input type="hidden" name="rental_unit_id" value={id} />
                    <button
                      type="submit"
                      className="rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Entfernen
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Buchungen
        </h2>
        {!bookings?.length ? (
          <p className="mt-2 text-sm text-zinc-500">Noch keine Buchungen vorhanden.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {booking.customer_name}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {booking.customer_email}
                      {booking.customer_phone ? ` · ${booking.customer_phone}` : null}
                    </p>
                    <p className="mt-1 text-sm">
                      Zeitraum: {booking.start_date} bis {booking.end_date}
                    </p>
                    {(() => {
                      const inquiry = booking.inquiries;
                      const selections =
                        inquiry &&
                        typeof inquiry === "object" &&
                        "accessory_selections" in inquiry
                          ? (inquiry as {
                              accessory_selections?: Array<{
                                accessory_id: string;
                                quantity: number;
                              }>;
                            }).accessory_selections
                          : [];
                      const accessoryDailyCents = Array.isArray(selections)
                        ? selections.reduce((sum, selection) => {
                            const qty = Math.max(0, Number(selection.quantity) || 0);
                            const item = accessoryDailyById.get(selection.accessory_id) ?? 0;
                            return sum + item * qty;
                          }, 0)
                        : 0;
                      const perDayCents =
                        (listing?.daily_rate_cents ?? 0) + accessoryDailyCents;
                      const rentalDays =
                        Math.floor(
                          (new Date(`${booking.end_date}T00:00:00Z`).getTime() -
                            new Date(`${booking.start_date}T00:00:00Z`).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) + 1;
                      const priceWithDiscount = calculateRentalPrice(
                        perDayCents,
                        rentalDays,
                        globalDiscountTiers ?? [],
                      );
                      return (
                        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                          Endpreis:{" "}
                          <span className="font-semibold">
                            {formatEurFromCents(priceWithDiscount.finalTotalCents)}
                          </span>
                          {priceWithDiscount.discountPercentApplied > 0 ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              {" "}
                              (inkl. {priceWithDiscount.discountPercentApplied}% Rabatt)
                            </span>
                          ) : null}
                        </p>
                      );
                    })()}
                  </div>
                  <form action={updateBookingStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={booking.id} />
                    <input type="hidden" name="rental_unit_id" value={id} />
                    <select
                      name="status"
                      defaultValue={booking.status}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-zinc-900 px-3 py-1 text-xs text-white dark:bg-white dark:text-zinc-900"
                    >
                      Speichern
                    </button>
                  </form>
                </div>
                {booking.customer_message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {booking.customer_message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Miet-Zubehör im Konfigurator
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ausgewählte Positionen werden pro Tag zum Mietpreis addiert.
        </p>
        {!rentalAccessories.length ? (
          <p className="mt-3 text-sm text-zinc-500">
            Kein aktives Miet-Zubehör vorhanden. Unter „Anhänger mieten“ zuerst
            Zubehör anlegen.
          </p>
        ) : (
          <form action={saveRentalUnitAccessories} className="mt-4 space-y-3">
            <input type="hidden" name="admin_context" value="rental-detail" />
            <input type="hidden" name="rental_unit_id" value={id} />
            <ul className="space-y-2">
              {rentalAccessories.map((accessory) => (
                <li
                  key={accessory.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="accessory"
                      value={accessory.id}
                      defaultChecked={linkedMap.has(accessory.id)}
                    />
                    {accessory.name} ({(accessory.price_adjustment_cents / 100).toFixed(2)} €
                    /Tag)
                  </label>
                  <label className="flex items-center gap-1 text-xs text-zinc-500">
                    max.
                    <input
                      name={`max_${accessory.id}`}
                      type="number"
                      min="1"
                      defaultValue={linkedMap.get(accessory.id) ?? 1}
                      className="w-16 rounded border border-zinc-300 px-1 py-0.5 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Miet-Zubehör speichern
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
