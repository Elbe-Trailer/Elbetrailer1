import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import ListingCard from "@/components/ListingCard";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildItemListSchema,
  buildLocalBusinessSchema,
} from "@/lib/seo/listing-schema";
import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
import { COMPANY } from "@/lib/company";
import { getServiceArea } from "@/lib/service-areas";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types/database";

type Props = {
  params: Promise<{ ort: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ort } = await params;
  const area = getServiceArea(ort);
  if (!area) {
    return { title: "Standort", robots: { index: false, follow: false } };
  }
  return buildPageMetadata({
    title: area.headline,
    description: area.metaDescription,
    path: `/anhaenger-kaufen/${area.slug}`,
  });
}

export default async function ServiceAreaPage({ params }: Props) {
  const { ort } = await params;
  const area = getServiceArea(ort);
  if (!area) notFound();

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, slug, title, price_cents, daily_rate_cents, listing_type, gallery_paths",
    )
    .eq("published", true)
    .in("listing_type", ["kauf", "kauf_und_miete"])
    .order("created_at", { ascending: false })
    .limit(12);

  const list = (listings ?? []) as Pick<
    Listing,
    | "id"
    | "slug"
    | "title"
    | "price_cents"
    | "daily_rate_cents"
    | "listing_type"
    | "gallery_paths"
  >[];

  const pageUrl = absoluteUrl(`/anhaenger-kaufen/${area.slug}`);
  const childAreas = (area.childSlugs ?? [])
    .map((childSlug) => getServiceArea(childSlug))
    .filter((child): child is NonNullable<typeof child> => child !== null);

  return (
    <ContentContainer>
      <JsonLd
        data={[
          buildLocalBusinessSchema({ areaServed: area.areaServed }),
          buildBreadcrumbSchema([
            { name: "Start", url: absoluteUrl("/") },
            { name: "Anhänger kaufen", url: absoluteUrl("/anhaenger") },
            { name: area.city, url: pageUrl },
          ]),
          buildFaqPageSchema(area.faq),
          ...(list.length
            ? [
                buildItemListSchema(
                  list.map((listing) => ({
                    url: absoluteUrl(listingPublicPath(listing.slug)),
                    name: listing.title,
                  })),
                ),
              ]
            : []),
        ]}
      />
      <div className="space-y-10">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/" className="hover:underline">
              Start
            </Link>
            <span className="mx-2">/</span>
            <Link href="/anhaenger" className="hover:underline">
              Anhänger kaufen
            </Link>
            <span className="mx-2">/</span>
            <span>{area.city}</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            {area.headline}
          </h1>
          <div className="mt-4 max-w-3xl space-y-3 text-zinc-600 dark:text-zinc-400">
            {area.intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Anfahrt, Lieferung & Kontakt (NAP) */}
        <section className="grid gap-6 rounded-xl border border-zinc-200 p-6 sm:grid-cols-2 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Anfahrt &amp; Lieferung
            </h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {area.drivingRoute}
            </p>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {area.deliveryNote}
            </p>
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              elbe-trailer — Ihr Standort
            </h2>
            <address className="mt-3 not-italic leading-relaxed">
              {COMPANY.legalName}
              <br />
              {COMPANY.address.street}
              <br />
              {COMPANY.address.postalCode} {COMPANY.address.locality}
              <br />
              {COMPANY.address.region}
            </address>
            <p className="mt-3">
              <a
                href={`tel:${COMPANY.phoneTel}`}
                className="font-medium text-brand underline dark:text-red-400"
              >
                {COMPANY.phoneDisplay}
              </a>
            </p>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Mo–Fr 9:00–18:00 Uhr · Sa 10:00–16:00 Uhr
            </p>
          </div>
        </section>

        {childAreas.length ? (
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Regionen im Überblick
            </h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {childAreas.map((child) => (
                <li key={child.slug}>
                  <Link
                    href={`/anhaenger-kaufen/${child.slug}`}
                    className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Anhänger kaufen in {child.city}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Aktuelle Anhänger
            </h2>
            <Link
              href="/anhaenger"
              className="text-sm font-medium text-brand hover:underline dark:text-red-400"
            >
              Alle Anhänger mit Filter ansehen →
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
              Zurzeit keine veröffentlichten Kauf-Inserate.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} mode="kauf" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Häufige Fragen — {area.city}
          </h2>
          <dl className="mt-6 max-w-3xl space-y-6">
            {area.faq.map((item, index) => (
              <div key={index}>
                <dt className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.question}
                </dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </ContentContainer>
  );
}
