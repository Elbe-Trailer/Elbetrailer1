import { sanitizeBlogHtml } from "@/lib/blog-content";
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
    content: `<p>Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie über die Verarbeitung personenbezogener Daten auf dieser Website. Bitte passen Sie diesen Beispieltext an Ihre tatsächlichen Gegebenheiten an und ergänzen Sie fehlende Angaben (z. B. Verantwortlicher, Kontaktdaten des Datenschutzbeauftragten).</p>
<h2>1. Verantwortlicher</h2>
<p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br>[Firmenname]<br>[Straße und Hausnummer]<br>[PLZ Ort]<br>E-Mail: [kontakt@beispiel.de]</p>
<h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
<p>Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Erfasst werden u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, Name und URL der abgerufenen Datei, Website, von der aus der Zugriff erfolgt, verwendeter Browser und ggf. das Betriebssystem Ihres Rechners.</p>
<h2>3. Anfragen über Inserate und Kontaktformular</h2>
<p>Wenn Sie über ein Inserat oder unser Kontaktformular eine Anfrage stellen, verarbeiten wir die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachricht) zur Bearbeitung Ihres Anliegens. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).</p>
<h2>4. Cookies und technisch notwendige Funktionen</h2>
<p>Wir setzen Cookies ein, soweit dies für den Betrieb der Website erforderlich ist (z. B. Anmeldesitzung für Administratoren, Darstellungseinstellungen). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben.</p>
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
<h2>7. Aktualität und Änderung dieser Datenschutzerklärung</h2>
<p>Diese Datenschutzerklärung ist aktuell gültig. Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung anzupassen.</p>`,
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
