import { sanitizeBlogHtml } from "@/lib/blog-content";
import { unstable_cache } from "next/cache";
import {
  SITE_CACHE_REVALIDATE_SECONDS,
  SITE_CACHE_TAGS,
} from "@/lib/cache/tags";
import { createAnonServerClient } from "@/lib/supabase/anon-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SitePageSlug =
  | "ueber-uns"
  | "service"
  | "kontakt"
  | "impressum"
  | "datenschutz";

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
  datenschutz: {
    title: "Datenschutz",
    content: `<p>Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie über die Verarbeitung personenbezogener Daten auf dieser Website.</p>
<h2>1. Verantwortlicher</h2>
<p>Verantwortlich für die Datenverarbeitung auf dieser Website ist der in unserem <a href="/impressum">Impressum</a> genannte Anbieter. Für Fragen zum Datenschutz erreichen Sie uns über die dort angegebenen Kontaktdaten.</p>
<h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
<p>Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Erfasst werden u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, Name und URL der abgerufenen Datei, Website, von der aus der Zugriff erfolgt, verwendeter Browser und ggf. das Betriebssystem Ihres Rechners.</p>
<h2>3. Anfragen über Inserate und Kontaktformular</h2>
<p>Wenn Sie über ein Inserat oder unser Kontaktformular eine Anfrage stellen, verarbeiten wir die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachricht) zur Bearbeitung Ihres Anliegens. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).</p>
<h2>4. Cookies, localStorage und Einwilligungsverwaltung</h2>
<p>Wir verwenden Cookies und vergleichbare Technologien (localStorage) auf Ihrem Endgerät. Nicht notwendige Speicherungen und Webanalyse setzen wir erst nach Ihrer ausdrücklichen Einwilligung ein (§ 25 TTDSG, Art. 6 Abs. 1 lit. a DSGVO).</p>
<h3>4.1 Technisch notwendig</h3>
<ul>
<li><strong>Anmeldesitzung (Cookie):</strong> Für den geschützten Admin-Bereich. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</li>
<li><strong>Darstellungseinstellungen (localStorage, Schlüssel „theme“):</strong> Speichert Ihre Wahl zwischen hellem und dunklem Modus. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</li>
<li><strong>Cookie-Einwilligung (localStorage, Schlüssel „elbe-trailer-consent“):</strong> Speichert Ihre Entscheidung zum Cookie-Banner, den Zeitpunkt der Auswahl und die Version dieser Datenschutzerklärung (aktuell: 2026-06-10). Rechtsgrundlage: Art. 6 Abs. 1 lit. c DSGVO (Nachweispflicht) bzw. lit. f DSGVO (berechtigtes Interesse an dokumentierter Einwilligung). Speicherdauer: 12 Monate, danach erneute Abfrage.</li>
</ul>
<h3>4.2 Webanalyse (nur mit Einwilligung)</h3>
<p>Google Analytics 4 wird nur geladen, wenn Sie im Cookie-Banner „Alle akzeptieren“ wählen oder Webanalyse in den Cookie-Einstellungen aktivieren. Details siehe Abschnitt <a href="#webanalyse">Webanalyse</a>.</p>
<p>Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über „Cookie-Einstellungen“ im Footer. Dabei wird die gespeicherte Einwilligung zurückgesetzt, Google Analytics deaktiviert und bereits gesetzte Analyse-Cookies entfernt.</p>
<h2>5. Hosting und Auftragsverarbeitung</h2>
<p>Diese Website wird bei einem externen Dienstleister gehostet. Personenbezogene Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Mit dem Hoster wurde ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO geschlossen, soweit erforderlich.</p>
<h2>6. Ihre Rechte</h2>
<p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
<ul>
<li>Recht auf Auskunft (Art. 15 DSGVO)</li>
<li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
<li>Recht auf Löschung (Art. 17 DSGVO)</li>
<li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
<li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
<li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
</ul>
<p>Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>
<h2 id="webanalyse">7. Webanalyse (Google Analytics 4)</h2>
<p>Wenn Sie Webanalyse erlauben, setzen wir Google Analytics 4 ein, einen Webanalysedienst der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland) bzw. Google LLC (USA).</p>
<p><strong>Zweck:</strong> Reichweitenmessung und Analyse des Nutzungsverhaltens, um unser Angebot zu verbessern.</p>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über „Cookie-Einstellungen“ im Footer.</p>
<p><strong>Verarbeitete Daten:</strong> u. a. gekürzte IP-Adresse, Seitenaufrufe, Verweildauer, Geräte- und Browserinformationen, ungefährer Standort (Land/Region). Die IP-Anonymisierung ist aktiviert.</p>
<p><strong>Speicherdauer:</strong> gemäß den Einstellungen in Google Analytics (standardmäßig begrenzte Aufbewahrungsfristen).</p>
<p><strong>Drittlandtransfer:</strong> Daten können in die USA übermittelt werden. Google stützt sich u. a. auf Standardvertragsklauseln der EU-Kommission.</p>
<p><strong>Widerspruch:</strong> Browser-Plugin zur Deaktivierung von Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer" target="_blank">https://tools.google.com/dlpage/gaoptout</a></p>
<h2>8. Aktualität und Änderung dieser Datenschutzerklärung</h2>
<p>Diese Datenschutzerklärung ist aktuell gültig (Version 2026-06-10). Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung anzupassen. Bei wesentlichen Änderungen holen wir Ihre Einwilligung erneut ein.</p>`,
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

export function getCachedSitePageContent(slug: SitePageSlug) {
  return unstable_cache(
    async () => getSitePageContent(createAnonServerClient(), slug),
    [`site-page-${slug}`],
    {
      revalidate: SITE_CACHE_REVALIDATE_SECONDS,
      tags: [`site-page-${slug}`, SITE_CACHE_TAGS.marketing],
    },
  )();
}
