import Link from "next/link";
import BannerCarousel from "@/components/BannerCarousel";
import FullBleed from "@/components/FullBleed";
import ListingCard from "@/components/ListingCard";
import { createClient } from "@/lib/supabase/server";
import type { BannerSlide, Listing } from "@/types/database";

type HomeCategory = { slug: string; name: string };

function TrailerSketch({ category }: { category: HomeCategory }) {
  const slug = category.slug.toLowerCase();
  const stroke = "currentColor";
  if (slug === "kipper") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <rect
          x="30"
          y="18"
          width="48"
          height="16"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          transform="rotate(-10 30 18)"
        />
        <line x1="16" y1="40" x2="30" y2="30" stroke={stroke} strokeWidth="2" />
        <line x1="30" y1="30" x2="38" y2="30" stroke={stroke} strokeWidth="2" />
        <circle cx="40" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="84" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "maschinen") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <rect x="24" y="24" width="62" height="10" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="24" y2="30" stroke={stroke} strokeWidth="2" />
        <line x1="86" y1="34" x2="100" y2="28" stroke={stroke} strokeWidth="2" />
        <line x1="100" y1="28" x2="108" y2="28" stroke={stroke} strokeWidth="2" />
        <rect x="46" y="17" width="16" height="8" rx="1.5" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M62 21 L72 17" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="72" y1="17" x2="77" y2="19" stroke={stroke} strokeWidth="2" />
        <circle cx="50" cy="25" r="2" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="60" cy="25" r="2" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="36" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="72" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "pkw-koffer") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <rect x="22" y="10" width="68" height="24" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="24" y2="28" stroke={stroke} strokeWidth="2" />
        <line x1="86" y1="16" x2="86" y2="34" stroke={stroke} strokeWidth="2" />
        <circle cx="38" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="72" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "pferde") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <path d="M24 34 V20 Q24 14 32 14 H76 Q88 14 88 26 V34" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="24" y2="30" stroke={stroke} strokeWidth="2" />
        <line x1="70" y1="20" x2="80" y2="20" stroke={stroke} strokeWidth="2" />
        <circle cx="38" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="72" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "boot") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="28" y2="31" stroke={stroke} strokeWidth="2" />
        <line x1="28" y1="31" x2="86" y2="31" stroke={stroke} strokeWidth="2" />
        <path d="M34 25 Q52 14 76 20 Q80 21 84 24" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="50" y1="24" x2="66" y2="24" stroke={stroke} strokeWidth="2" />
        <line x1="78" y1="24" x2="78" y2="30" stroke={stroke} strokeWidth="2" />
        <line x1="78" y1="30" x2="82" y2="32" stroke={stroke} strokeWidth="2" />
        <circle cx="42" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="74" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "planen") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <rect x="24" y="22" width="64" height="12" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
        <path d="M26 22 Q56 10 86 22" fill="none" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="24" y2="30" stroke={stroke} strokeWidth="2" />
        <circle cx="38" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="72" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (slug === "tieflader") {
    return (
      <svg
        viewBox="0 0 120 56"
        className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
        aria-hidden
      >
        <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
        <line x1="10" y1="40" x2="30" y2="32" stroke={stroke} strokeWidth="2" />
        <line x1="30" y1="32" x2="88" y2="32" stroke={stroke} strokeWidth="2" />
        <line x1="30" y1="32" x2="30" y2="24" stroke={stroke} strokeWidth="2" />
        <line x1="88" y1="32" x2="96" y2="26" stroke={stroke} strokeWidth="2" />
        <circle cx="42" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="56" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
        <circle cx="74" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 56"
      className="h-10 w-24 text-zinc-500 transition group-hover:text-brand dark:text-zinc-400 dark:group-hover:text-red-400"
      aria-hidden
    >
      <line x1="8" y1="40" x2="112" y2="40" stroke={stroke} strokeWidth="2" />
      <rect x="24" y="20" width="64" height="14" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
      <line x1="10" y1="40" x2="24" y2="30" stroke={stroke} strokeWidth="2" />
      <line x1="88" y1="30" x2="98" y2="30" stroke={stroke} strokeWidth="2" />
      <path d="M42 24 H62 L68 28 H40 Z" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="46" cy="30" r="2" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="60" cy="30" r="2" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="38" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
      <circle cx="72" cy="40" r="5" fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

async function loadHome() {
  let banners: BannerSlide[] = [];
  let categories: HomeCategory[] = [];
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
                    className="group flex h-full min-h-[160px] flex-col border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  >
                    <TrailerSketch category={c} />
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
