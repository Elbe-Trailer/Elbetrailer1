import { sanitizeBlogHtml } from "@/lib/blog-content";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SitePageSlug = "ueber-uns" | "service" | "kontakt" | "impressum";

const FALLBACKS: Record<SitePageSlug, { title: string; content: string }> = {
  "ueber-uns": {
    title: "Über uns",
    content:
      "<p>Wir sind Ihr Ansprechpartner rund um Anhänger — vom kompakten PKW-Anhänger bis zu Speziallösungen für Boot, Pferd oder Maschinen.</p>",
  },
  service: {
    title: "Service",
    content:
      "<p>Hier können Sie Ihre Serviceleistungen beschreiben, z. B. Wartung, Ersatzteile, Zulassung oder Beratung.</p>",
  },
  kontakt: {
    title: "Kontakt",
    content:
      "<p>Nutzen Sie die Anfragefunktion auf den Inseraten oder schreiben Sie uns mit Ihrem Anliegen — z. B. zu Verfügbarkeit, Ausstattung oder Händlerkooperation.</p>",
  },
  impressum: {
    title: "Impressum",
    content:
      "<p>Bitte hinterlegen Sie hier Ihre vollständigen Impressumsangaben gemäß § 5 TMG.</p>",
  },
};

export async function getSitePageContent(
  supabase: SupabaseClient,
  slug: SitePageSlug,
) {
  const { data } = await supabase
    .from("site_pages")
    .select("slug, title, content")
    .eq("slug", slug)
    .maybeSingle();

  const fallback = FALLBACKS[slug];
  return {
    slug,
    title: data?.title ?? fallback.title,
    content: sanitizeBlogHtml(data?.content ?? fallback.content),
  };
}
