import Image from "next/image";
import Link from "next/link";
import { formatEurFromCents } from "@/lib/format";
import { publicStorageUrl } from "@/lib/storage";
import type { Listing, ListingType } from "@/types/database";

type Props = {
  listing: Pick<
    Listing,
    "id" | "title" | "price_cents" | "daily_rate_cents" | "listing_type" | "gallery_paths"
  >;
  mode?: "auto" | "kauf" | "miete";
  /** z. B. `?ansicht=miete` für Kauf+Miete-Inserate in der Miet-Übersicht */
  detailQuery?: string;
};

function priceLabel(
  type: ListingType,
  price_cents: number | null,
  daily: number | null,
  mode: "auto" | "kauf" | "miete",
) {
  if (mode === "miete") {
    return daily != null ? `${formatEurFromCents(daily)} / Tag` : "Preis auf Anfrage";
  }
  if (mode === "kauf") {
    return price_cents != null ? formatEurFromCents(price_cents) : "Preis auf Anfrage";
  }
  if ((type === "miete" || type === "kauf_und_miete") && daily != null) {
    return `${formatEurFromCents(daily)} / Tag`;
  }
  if (price_cents != null) {
    return formatEurFromCents(price_cents);
  }
  return "Preis auf Anfrage";
}

export default function ListingCard({
  listing,
  mode = "auto",
  detailQuery = "",
}: Props) {
  const first = listing.gallery_paths[0];
  const href = `/inserat/${listing.id}${detailQuery}`;
  return (
    <Link
      href={href}
      className="group block overflow-hidden border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
        {first ? (
          <Image
            src={publicStorageUrl("listings", first)}
            alt=""
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
            unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Kein Bild
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
          {listing.title}
        </h3>
        <p className="mt-1 text-sm font-semibold text-brand dark:text-red-400">
          {priceLabel(
            listing.listing_type,
            listing.price_cents,
            listing.daily_rate_cents,
            mode,
          )}
        </p>
      </div>
    </Link>
  );
}
