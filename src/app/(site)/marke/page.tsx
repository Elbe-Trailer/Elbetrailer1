import type { Metadata } from "next";
import Link from "next/link";
import ContentContainer from "@/components/ContentContainer";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/listing-schema";
import { absoluteUrl } from "@/lib/site-url";
import { getIndexableBrands } from "@/lib/brands";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const brands = await getIndexableBrands(supabase);
  return buildPageMetadata({
    title: "Anhänger nach Marke kaufen",
    description:
      "Anhänger nach Marke kaufen bei elbe-trailer — Markenseiten mit Inseraten, technischen Daten und Beratung. Lieferung in Hamburg und Norddeutschland.",
    path: "/marke",
    // Solange keine Marke die Index-Schwelle erreicht, bleibt die Übersicht noindex.
    noIndex: brands.length === 0,
  });
}

export default async function BrandHubPage() {
  const supabase = await createClient();
  const brands = await getIndexableBrands(supabase);

  return (
    <ContentContainer>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Start", url: absoluteUrl("/") },
          { name: "Anhänger kaufen", url: absoluteUrl("/anhaenger") },
          { name: "Marken", url: absoluteUrl("/marke") },
        ])}
      />
      <div className="space-y-8">
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
            <span>Marken</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
            Anhänger nach Marke kaufen
          </h1>
          <p className="mt-4 max-w-3xl text-zinc-600 dark:text-zinc-400">
            Wählen Sie eine Marke, um alle passenden Kauf-Inserate mit technischen
            Daten zu sehen. Wir liefern in Hamburg und ganz Norddeutschland oder Sie
            holen direkt bei uns in Möhnsen ab.
          </p>
        </div>

        {brands.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
            Zurzeit sind keine Marken-Übersichten verfügbar. Sehen Sie sich{" "}
            <Link href="/anhaenger" className="font-medium text-brand underline dark:text-red-400">
              alle Anhänger
            </Link>{" "}
            an.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/marke/${brand.slug}`}
                  className="group flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <span className="text-lg font-semibold text-zinc-900 group-hover:text-[var(--header-green)] dark:text-white">
                    {brand.displayName} Anhänger kaufen
                  </span>
                  <span className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {brand.kaufCount > 0
                      ? `${brand.kaufCount} ${
                          brand.kaufCount === 1 ? "Inserat" : "Inserate"
                        } ansehen →`
                      : "Modelle auf Anfrage →"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ContentContainer>
  );
}
