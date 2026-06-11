import { requireAdmin } from "@/lib/auth/admin";
import { formatEurFromCents } from "@/lib/format";
import { calculateRentalPrice } from "@/lib/rentalPricing";
import Link from "next/link";
import { listingPublicPath } from "@/lib/listing-url";
import {
  deleteContactInquiry,
  deleteInquiry,
  updateContactInquiryStatus,
  updateInquiryStatus,
} from "./actions";

export default async function AdminInquiriesPage() {
  const { supabase } = await requireAdmin();
  const [inquiriesResult, contactInquiriesResult] = await Promise.all([
    supabase
      .from("inquiries")
      .select(
        "id, name, email, phone, message, status, accessory_selections, start_date, end_date, rental_unit_id, created_at, listing_id, listings ( slug, title, listing_type, price_cents, daily_rate_cents )",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contact_inquiries")
      .select("id, name, email, phone, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const inquiriesNeedsFallback = inquiriesResult.error?.message?.includes("status");
  const contactNeedsFallback = contactInquiriesResult.error?.message?.includes("status");
  const [inquiriesFallbackResult, contactFallbackResult] = await Promise.all([
    inquiriesNeedsFallback
      ? supabase
          .from("inquiries")
          .select(
            "id, name, email, phone, message, accessory_selections, start_date, end_date, rental_unit_id, created_at, listing_id, listings ( slug, title, listing_type, price_cents, daily_rate_cents )",
          )
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve(null),
    contactNeedsFallback
      ? supabase
          .from("contact_inquiries")
          .select("id, name, email, phone, message, created_at")
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve(null),
  ]);
  const rows = inquiriesNeedsFallback
    ? (inquiriesFallbackResult?.data ?? []).map((row) => ({ ...row, status: "neu" }))
    : (inquiriesResult.data ?? []);
  const contactRows = contactNeedsFallback
    ? (contactFallbackResult?.data ?? []).map((row) => ({ ...row, status: "neu" }))
    : (contactInquiriesResult.data ?? []);
  const accessoryIds = Array.from(
    new Set(
      (rows ?? []).flatMap((row) =>
        Array.isArray(row.accessory_selections)
          ? (row.accessory_selections as { accessory_id: string; quantity: number }[]).map(
              (selection) => selection.accessory_id,
            )
          : [],
      ),
    ),
  );
  const accessoryById = new Map<
    string,
    { name: string; article_number: string | null; price_adjustment_cents: number }
  >();
  const { data: globalDiscountTiers } = await supabase
    .from("rental_discount_tiers")
    .select("min_days, discount_percent")
    .order("min_days", { ascending: true });
  if (accessoryIds.length > 0) {
    const { data: accessoryRows } = await supabase
      .from("accessories")
      .select("id, name, article_number, price_adjustment_cents")
      .in("id", accessoryIds);
    for (const accessory of accessoryRows ?? []) {
      accessoryById.set(accessory.id as string, {
        name: String(accessory.name),
        article_number:
          accessory.article_number == null ? null : String(accessory.article_number),
        price_adjustment_cents:
          typeof accessory.price_adjustment_cents === "number"
            ? accessory.price_adjustment_cents
            : 0,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Anfragen
      </h1>

      {!rows?.length ? (
        <p className="text-zinc-500">Noch keine Inserat-Anfragen.</p>
      ) : (
        <ul className="space-y-6">
          {rows.map((r) => {
            const isNew = r.status === "neu";
            const listingMeta =
              r.listings && typeof r.listings === "object"
                ? (r.listings as {
                    slug?: string;
                    title?: string;
                    listing_type?: "kauf" | "miete" | "kauf_und_miete" | null;
                    price_cents?: number | null;
                    daily_rate_cents?: number | null;
                  })
                : null;
            const listingTitle = listingMeta?.title ? String(listingMeta.title) : "—";
            const listingSlug = listingMeta?.slug ? String(listingMeta.slug) : null;
            const listingDetails = listingMeta;
            const selections = Array.isArray(r.accessory_selections)
              ? (r.accessory_selections as { accessory_id: string; quantity: number }[])
              : [];
            const accessoryTotalCents = selections.reduce((sum, selection) => {
              const qty = Math.max(0, Number(selection.quantity) || 0);
              const accessory = accessoryById.get(selection.accessory_id);
              const priceAdjustment = accessory?.price_adjustment_cents ?? 0;
              return sum + priceAdjustment * qty;
            }, 0);
            const isRentalInquiry = !!(r.start_date && r.end_date);
            const basePriceCents = isRentalInquiry
              ? (listingDetails?.daily_rate_cents ?? null)
              : (listingDetails?.price_cents ?? null);
            const subtotalCents =
              basePriceCents == null ? null : basePriceCents + accessoryTotalCents;
            const rentalDays = isRentalInquiry
              ? Math.floor(
                  (new Date(`${r.end_date}T00:00:00Z`).getTime() -
                    new Date(`${r.start_date}T00:00:00Z`).getTime()) /
                    (1000 * 60 * 60 * 24),
                ) + 1
              : null;
            const rentalPriceWithDiscount =
              isRentalInquiry && subtotalCents != null && (rentalDays ?? 0) > 0
                ? calculateRentalPrice(subtotalCents, rentalDays as number, globalDiscountTiers ?? [])
                : null;
            return (
              <li
                key={r.id}
                className={`rounded-xl border p-4 ${
                  isNew
                    ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.name}</p>
                      {isNew ? (
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Neu
                        </span>
                      ) : null}
                    </div>
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
                  <span className="text-zinc-500">Inserat:</span>{" "}
                  {listingSlug ? (
                    <Link
                      className="underline"
                      href={listingPublicPath(listingSlug, `?anfrage=${r.id}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {listingTitle}
                    </Link>
                  ) : (
                    listingTitle
                  )}
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
                <div className="mt-4">
                  <form action={updateInquiryStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <label
                      htmlFor={`inquiry-status-${r.id}`}
                      className="text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      Status:
                    </label>
                    <select
                      id={`inquiry-status-${r.id}`}
                      name="status"
                      defaultValue={r.status ?? "neu"}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      <option value="neu">Neu</option>
                      <option value="in_bearbeitung">In Bearbeitung</option>
                      <option value="abgeschlossen">Abgeschlossen</option>
                    </select>
                    <button
                      type="submit"
                      className="text-sm text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Speichern
                    </button>
                  </form>
                </div>
                {selections.length > 0 ? (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-zinc-600 dark:text-zinc-400">
                      Gewähltes Zubehör
                    </p>
                    <ul className="mt-1 list-inside list-disc">
                      {selections.map((s) => {
                        const accessory = accessoryById.get(s.accessory_id);
                        const label = accessory
                          ? accessory.article_number
                            ? `${accessory.name} (Art.-Nr. ${accessory.article_number})`
                            : accessory.name
                          : `Zubehör ${s.accessory_id.slice(0, 8)}…`;
                        return (
                          <li key={s.accessory_id}>
                            {label} × {s.quantity}
                            {accessory ? (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {" "}
                                ({formatEurFromCents(accessory.price_adjustment_cents)}{" "}
                                {isRentalInquiry ? "/ Tag" : "je Stück"})
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">
                    Preisübersicht
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                    Basispreis{isRentalInquiry ? " / Tag" : ""}:{" "}
                    {formatEurFromCents(basePriceCents)}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    Zubehör{isRentalInquiry ? " / Tag" : ""}:{" "}
                    {formatEurFromCents(accessoryTotalCents)}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">
                    {isRentalInquiry ? "Zwischensumme / Tag" : "Zwischensumme"}:{" "}
                    {formatEurFromCents(subtotalCents)}
                  </p>
                  {isRentalInquiry && (rentalDays ?? 0) > 0 ? (
                    <>
                      {rentalPriceWithDiscount &&
                      rentalPriceWithDiscount.discountPercentApplied > 0 ? (
                        <>
                          <p className="mt-1 text-zinc-700 dark:text-zinc-200">
                            Gesamt vor Rabatt ({rentalDays} Tage):{" "}
                            {formatEurFromCents(rentalPriceWithDiscount.grossTotalCents)}
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-300">
                            Rabatt ({rentalPriceWithDiscount.discountPercentApplied}%): -
                            {formatEurFromCents(rentalPriceWithDiscount.discountAmountCents)}
                          </p>
                        </>
                      ) : null}
                      <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                        Gesamt ({rentalDays} Tage):{" "}
                        {formatEurFromCents(
                          rentalPriceWithDiscount
                            ? rentalPriceWithDiscount.finalTotalCents
                            : subtotalCents,
                        )}
                      </p>
                    </>
                  ) : null}
                </div>
                <div className="mt-4">
                  <form action={deleteInquiry}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Anfrage löschen
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Kontakt-Anfragen
        </h2>
        {!contactRows?.length ? (
          <p className="mt-2 text-zinc-500">Noch keine Kontakt-Anfragen.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {contactRows.map((r) => {
              const isNew = r.status === "neu";
              return (
                <li
                  key={r.id}
                  className={`rounded-xl border p-4 ${
                    isNew
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.name}</p>
                      {isNew ? (
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Neu
                        </span>
                      ) : null}
                    </div>
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
                {r.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {r.message}
                  </p>
                ) : null}
                <div className="mt-4">
                  <form
                    action={updateContactInquiryStatus}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <label
                      htmlFor={`contact-inquiry-status-${r.id}`}
                      className="text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      Status:
                    </label>
                    <select
                      id={`contact-inquiry-status-${r.id}`}
                      name="status"
                      defaultValue={r.status ?? "neu"}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      <option value="neu">Neu</option>
                      <option value="in_bearbeitung">In Bearbeitung</option>
                      <option value="abgeschlossen">Abgeschlossen</option>
                    </select>
                    <button
                      type="submit"
                      className="text-sm text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Speichern
                    </button>
                  </form>
                </div>
                <div className="mt-4">
                  <form action={deleteContactInquiry}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Anfrage löschen
                    </button>
                  </form>
                </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
