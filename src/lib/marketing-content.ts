import type { SupabaseClient } from "@supabase/supabase-js";

export const MARKETING_CONTENT_FALLBACKS = {
  "home.hero.brand": { label: "Landingpage: Hero Brand", content: "elbe-trailer" },
  "home.hero.title": {
    label: "Landingpage: Hero Titel",
    content: "Was auch immer Sie transportieren — hier finden Sie die passende Lösung.",
  },
  "home.hero.subtitle": {
    label: "Landingpage: Hero Untertitel",
    content:
      "Kaufen oder mieten, Kategorien und Zubehör in der Übersicht, unverbindliche Anfrage in wenigen Schritten.",
  },
  "home.categories.intro.title": {
    label: "Landingpage: Kategorien Intro Titel",
    content: "Alles im Blick — strukturiert wie auf Herstellerseiten",
  },
  "home.categories.intro.body": {
    label: "Landingpage: Kategorien Intro Text",
    content:
      "Stöbern Sie in Kategorien, vergleichen Sie Inserate und stellen Sie auf der Detailseite Ihr Zubehör zusammen. So bleibt der Weg von der Idee bis zur Anfrage klar und übersichtlich.",
  },
  "home.categories.heading": { label: "Landingpage: Kategorien Überschrift", content: "Kategorien" },
  "home.categories.rental_link": {
    label: "Landingpage: Kategorien Miet-Link",
    content: "Oder direkt zu Miet-Angeboten →",
  },
  "home.categories.card_cta": {
    label: "Landingpage: Kategorien Karten-CTA",
    content: "Kauf-Inserate ansehen",
  },
  "home.highlights.heading": { label: "Landingpage: Highlights Überschrift", content: "Ausgewählte Angebote" },
  "home.highlights.empty_state": {
    label: "Landingpage: Highlights Leerstand",
    content:
      "Noch keine Highlights gesetzt. Im Admin-Bereich können Sie Inserate für die Startseite auswählen.",
  },
  "home.cta.discover.title": { label: "Landingpage: CTA Entdecken Titel", content: "Anhänger entdecken" },
  "home.cta.discover.body": {
    label: "Landingpage: CTA Entdecken Text",
    content:
      "Wählen Sie eine Kategorie und filtern Sie auf der Übersicht. Technische Daten und Bilder sehen Sie auf jeder Inserat-Detailseite.",
  },
  "home.cta.discover.button": { label: "Landingpage: CTA Entdecken Button", content: "Zu den Inseraten" },
  "home.cta.rent.title": { label: "Landingpage: CTA Mieten Titel", content: "Mieten" },
  "home.cta.rent.body": {
    label: "Landingpage: CTA Mieten Text",
    content: "Tages- und Wochenpreise, Verfügbarkeit und Anfrage — gebündelt auf der Miet-Übersicht.",
  },
  "home.cta.rent.button": { label: "Landingpage: CTA Mieten Button", content: "Miet-Angebote anzeigen" },
  "header.brand": { label: "Header: Markenname", content: "elbe-trailer" },
  "header.menu.trailers": { label: "Header: Menü Anhänger", content: "Anhänger" },
  "header.menu.all_trailers": { label: "Header: Menü Alle Anhänger", content: "Alle Anhänger" },
  "header.menu.no_categories": {
    label: "Header: Menü Keine Kategorien",
    content: "Keine Kategorien — bitte im Admin anlegen.",
  },
  "header.menu.rent": { label: "Header: Menü Mieten", content: "Mieten" },
  "header.nav.about": { label: "Header: Navigation Über uns", content: "Über uns" },
  "header.nav.service": { label: "Header: Navigation Service", content: "Service" },
  "header.nav.rent_trailers": { label: "Header: Navigation Anhänger mieten", content: "Anhänger mieten" },
  "header.nav.blog": { label: "Header: Navigation Blog", content: "Blog" },
  "header.nav.contact": { label: "Header: Navigation Kontakt", content: "Kontakt" },
  "header.mobile.categories_title": {
    label: "Header Mobile: Kategorien Titel",
    content: "Anhänger — Kategorien",
  },
  "header.mobile.no_categories": {
    label: "Header Mobile: Keine Kategorien",
    content: "Noch keine Kategorien in der Datenbank.",
  },
  "header.mobile.menu_open": { label: "Header Mobile: Menü öffnen", content: "Menü öffnen" },
  "header.mobile.menu_close": { label: "Header Mobile: Menü schließen", content: "Menü schließen" },
  "footer.brand": { label: "Footer: Markenname", content: "elbe-trailer" },
  "footer.description": {
    label: "Footer: Beschreibung",
    content:
      "Inserate mit technischen Angaben, Zubehör-Auswahl und unverbindlicher Anfrage — orientiert an bewährter Branchen-Information, übersichtlich aufgebaut.",
  },
  "footer.section.categories": { label: "Footer: Abschnitt Kategorien", content: "Kategorien" },
  "footer.section.offer": { label: "Footer: Abschnitt Angebot", content: "Angebot" },
  "footer.section.legal": { label: "Footer: Abschnitt Rechtliches", content: "Rechtliches & Kontakt" },
  "footer.categories.empty": { label: "Footer: Keine Kategorien", content: "Keine Kategorien" },
  "footer.link.rent": { label: "Footer: Link Mieten", content: "Mieten" },
  "footer.link.highlights": { label: "Footer: Link Ausgewählte Angebote", content: "Ausgewählte Angebote" },
  "footer.link.category_overview": { label: "Footer: Link Kategorieüberblick", content: "Kategorieüberblick" },
  "footer.link.blog": { label: "Footer: Link Blog", content: "Blog" },
  "footer.link.about": { label: "Footer: Link Über uns", content: "Über uns" },
  "footer.link.contact": { label: "Footer: Link Kontakt", content: "Kontakt" },
  "footer.link.imprint": { label: "Footer: Link Impressum", content: "Impressum" },
  "footer.note.inquiries": {
    label: "Footer: Hinweis Anfragen",
    content: "Hinweis: Unverbindliche Anfragen über die Inserate.",
  },
} as const;

export type MarketingContentKey = keyof typeof MARKETING_CONTENT_FALLBACKS;
export const MARKETING_CONTENT_KEYS = Object.keys(MARKETING_CONTENT_FALLBACKS) as MarketingContentKey[];

function normalizeMarketingContentValue(raw: string) {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export async function getMarketingContentMap(
  supabase: SupabaseClient,
  keys: readonly MarketingContentKey[],
) {
  const uniqueKeys = [...new Set(keys)];
  const { data } = await supabase
    .from("marketing_content")
    .select("key, content")
    .in("key", uniqueKeys);

  const dbMap = new Map(
    (data ?? []).map((row) => [row.key, normalizeMarketingContentValue(row.content)]),
  );
  return uniqueKeys.reduce(
    (acc, key) => {
      acc[key] = dbMap.get(key) ?? MARKETING_CONTENT_FALLBACKS[key].content;
      return acc;
    },
    {} as Record<MarketingContentKey, string>,
  );
}
