import Link from "next/link";
import BannerCarousel from "@/components/BannerCarousel";
import FullBleed from "@/components/FullBleed";
import ListingCard from "@/components/ListingCard";
import { createClient } from "@/lib/supabase/server";
import type { BannerSlide, Listing } from "@/types/database";

async function loadHome() {
  let banners: BannerSlide[] = [];
  let categories: { slug: string; name: string }[] = [];
  let portfolio: Pick<
    Listing,
    | "id"
    | "title"
    | "price_cents"
    | "daily_rate_cents"
    | "listing_type"
    | "gallery_paths"
  >[] = [];

  try {
    const supabase = await createClient();
    const { data: b } = await supabase
      .from("banner_slides")
      .select("id, image_path, sort_order, link_url, active")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    banners = (b ?? []) as BannerSlide[];

    const { data: cats } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = cats ?? [];

    const { data: highlightRows } = await supabase
      .from("listing_highlights")
      .select("listing_id, position")
      .order("position", { ascending: true });

    const ids = highlightRows?.map((h) => h.listing_id) ?? [];
    if (ids.length) {
      const { data: listings } = await supabase
        .from("listings")
        .select(
          "id, title, price_cents, daily_rate_cents, listing_type, gallery_paths",
        )
        .in("id", ids);
      const map = new Map(
        (listings ?? []).map((l) => [l.id as string, l as Listing]),
      );
      portfolio = ids
        .map((id) => map.get(id))
        .filter(Boolean) as typeof portfolio;
    }
  } catch {
    /* DB unavailable */
  }

  return { banners, categories, portfolio };
}

export default async function HomePage() {
  const { banners, categories, portfolio } = await loadHome();

  return (
    <>
      {/* Full-bleed hero — comparable to manufacturer landing sliders */}
      <FullBleed className="bg-zinc-900">
        <div className="relative">
          <BannerCarousel slides={banners} variant="hero" />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-10 pt-24 md:pb-14">
            <div className="mx-auto max-w-7xl">
              <p className="text-sm font-medium tracking-wide text-white/90 uppercase">
                elbe-trailer
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                Was auch immer Sie transportieren — hier finden Sie die passende
                Lösung.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/90">
                Kaufen oder mieten, Kategorien und Zubehör in der Übersicht,
                unverbindliche Anfrage in wenigen Schritten.
              </p>
            </div>
          </div>
        </div>
      </FullBleed>

      <div className="mx-auto w-full max-w-7xl space-y-20 px-4 py-16 md:py-20">
        <section className="scroll-mt-28 space-y-12" id="kategorien">
          <div className="max-w-3xl space-y-4 text-zinc-600 dark:text-zinc-400">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Alles im Blick — strukturiert wie auf Herstellerseiten
            </h2>
            <p className="text-base leading-relaxed">
              Stöbern Sie in Kategorien, vergleichen Sie Inserate und stellen Sie
              auf der Detailseite Ihr Zubehör zusammen. So bleibt der Weg von der
              Idee bis zur Anfrage klar und übersichtlich.
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-8" aria-labelledby="kategorien-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2
                id="kategorien-heading"
                className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
              >
                Kategorien
              </h2>
              <Link
                href="/mieten"
                className="text-sm font-medium text-brand hover:underline dark:text-red-400"
              >
                Oder direkt zu Miet-Angeboten →
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/kategorie/${c.slug}`}
                    className="group flex h-full min-h-[140px] flex-col justify-end border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  >
                    <span className="text-lg font-semibold text-zinc-900 group-hover:text-brand dark:text-white dark:group-hover:text-red-400">
                      {c.name}
                    </span>
                    <span className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      Kauf-Inserate ansehen
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            </div>
          ) : null}
        </section>

        <section
          className="scroll-mt-28 space-y-8"
          id="angebote"
          aria-labelledby="angebote-heading"
        >
          <h2
            id="angebote-heading"
            className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
          >
            Ausgewählte Angebote
          </h2>
          {portfolio.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
              Noch keine Highlights gesetzt. Im Admin-Bereich können Sie Inserate
              für die Startseite auswählen.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} mode="kauf" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <FullBleed className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Anhänger entdecken
              </h2>
              <p className="mt-3 text-zinc-300">
                Wählen Sie eine Kategorie und filtern Sie auf der Übersicht.
                Technische Daten und Bilder sehen Sie auf jeder
                Inserat-Detailseite.
              </p>
              <Link
                href={categories[0] ? `/kategorie/${categories[0].slug}` : "/#kategorien"}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Zu den Inseraten
              </Link>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Mieten
              </h2>
              <p className="mt-3 text-zinc-300">
                Tages- und Wochenpreise, Verfügbarkeit und Anfrage — gebündelt
                auf der Miet-Übersicht.
              </p>
              <Link
                href="/mieten"
                className="mt-6 inline-flex items-center justify-center rounded-md border-2 border-white/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Miet-Angebote anzeigen
              </Link>
            </div>
          </div>
        </div>
      </FullBleed>
    </>
  );
}
