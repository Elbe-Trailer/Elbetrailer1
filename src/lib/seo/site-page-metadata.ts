import type { Metadata } from "next";
import { getSitePageContent, type SitePageSlug } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/server";
import { buildPageMetadata } from "@/lib/seo/metadata";

const DESCRIPTIONS: Partial<Record<SitePageSlug, string>> = {
  "ueber-uns": "Lernen Sie elbe-trailer kennen — Ihr Ansprechpartner für Anhänger kaufen und mieten.",
  service: "Service, Wartung und Beratung rund um Anhänger bei elbe-trailer.",
  kontakt: "Kontaktieren Sie elbe-trailer — wir helfen bei Fragen zu Kauf, Miete und Zubehör.",
  impressum: "Impressum und Anbieterkennzeichnung von elbe-trailer.",
  datenschutz: "Datenschutzerklärung von elbe-trailer — Informationen zur Datenverarbeitung.",
};

export async function buildSitePageMetadata(slug: SitePageSlug): Promise<Metadata> {
  const supabase = await createClient();
  const page = await getSitePageContent(supabase, slug);
  return buildPageMetadata({
    title: page.title,
    description: DESCRIPTIONS[slug],
    path: `/${slug}`,
  });
}
