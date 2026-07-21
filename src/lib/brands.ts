import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSlug } from "@/lib/slug";

/**
 * Zentrale Marken-Quelle für die SEO-Markenseiten (/marke/[slug]).
 *
 * Das Feld `listings.brand` ist freier Text (im Admin nur getrimmt). Damit
 * "TA-NO", "Ta-No" und "ta-no" nicht in mehrere dünne Seiten zerfallen, wird
 * überall über den Slug (normalizeSlug) case-insensitiv zusammengefasst und die
 * Anzeige-Schreibweise aus {@link BRAND_META} bezogen.
 */

/**
 * Hinweis: Die Indexierung einer Markenseite hängt am redaktionellen Text
 * (siehe {@link isIndexableBrand}), NICHT mehr an einer Mindest-Inseratszahl.
 * Diese Konstante bleibt als Referenzwert erhalten (z. B. für „ausreichend
 * Bestand"-Hinweise), gated aber die Indexierung nicht.
 */
export const BRAND_INDEX_THRESHOLD = 3;

export type BrandFaq = { question: string; answer: string };

/** Redaktioneller H2-Abschnitt (Fließtext + optionale Aufzählung). */
export type BrandSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

/** Call-to-Action-Button unter dem redaktionellen Block. */
export type BrandCta = {
  label: string;
  href: string;
  /** primär = gefüllter Marken-Button, sonst umrandeter Sekundär-Button. */
  primary?: boolean;
};

export type BrandMeta = {
  /** Korrekte Schreibweise für Anzeige/Title (überschreibt die Rohform aus dem DB-Feld). */
  displayName: string;
  /** Herstellerseite — wird als schema.org `sameAs` der Brand-Entität ausgegeben. */
  manufacturerUrl?: string;
  /**
   * SEO-Title-Override (Ziel ~60 Zeichen). Wird als absoluter Title ausgegeben —
   * ohne das "%s | elbe-trailer"-Suffix, damit die Zeichengrenze eingehalten wird.
   * Fällt auf "{displayName} Anhänger kaufen" zurück.
   */
  metaTitle?: string;
  /** SEO-Meta-Description-Override (Ziel ~155 Zeichen). Sonst erster intro-Absatz. */
  metaDescription?: string;
  /** Sichtbare H1-Überschrift. Fällt auf "{displayName} Anhänger kaufen" zurück. */
  heading?: string;
  /** Redaktioneller Einleitungstext (Absätze). PFLICHT, damit die Seite indexiert werden darf. */
  intro?: string[];
  /** Weitere redaktionelle Abschnitte mit eigener H2-Überschrift. */
  sections?: BrandSection[];
  /** Call-to-Action-Buttons unter dem redaktionellen Block. */
  ctas?: BrandCta[];
  /** Marken-FAQ — rendert sichtbar und als FAQPage-Schema. */
  faq?: BrandFaq[];
};

/**
 * Kuratierte Marken-Metadaten, Schlüssel = Slug (normalizeSlug der gespeicherten
 * Marke). Nur Marken mit `intro` gelten als redaktionell gepflegt und dürfen
 * indexiert werden — neue Marken hier ergänzen, sonst bleibt die Seite bewusst
 * `noindex`. Die Texte sind Startpunkte und sollten vom Inhaber geprüft/erweitert
 * werden (Ziel laut SEO-Analyse: ~300–500 Wörter eigener Text pro Marke).
 */
export const BRAND_META: Record<string, BrandMeta> = {
  "ta-no": {
    displayName: "TA-NO",
    manufacturerUrl: "https://ta-no.com.pl/de/",
    metaTitle: "TA-NO Anhänger – Robuste Transportlösungen bis 3,5 t",
    metaDescription:
      "TA-NO Anhänger vereinen Qualität, Innovation & Individualität. Vom Autotransporter über Kipper bis zum Bootsanhänger – jetzt entdecken und beraten lassen.",
    heading: "TA-NO Anhänger – Qualität, die Ihren Transport bewegt",
    intro: [
      "Wenn es um zuverlässige Transportlösungen geht, steht die Marke TA-NO seit über 25 Jahren für durchdachte Technik, robuste Verarbeitung und maßgeschneiderte Anhänger. Als einer der erfahrensten Hersteller der Branche fertigt TA-NO hochwertige Anhänger und Nutzfahrzeugaufbauten mit einem zulässigen Gesamtgewicht bis 3,5 t – entwickelt von Profis aus dem Transportgewerbe und gebaut für den täglichen Einsatz.",
    ],
    sections: [
      {
        heading: "Ein Anhänger für jeden Einsatzzweck",
        paragraphs: [
          "Ob Fahrzeug, Baumaschine, Boot oder Ausrüstung – im TA-NO Sortiment finden Sie für jede Aufgabe den passenden Anhänger. Das Programm reicht von wendigen Einachsanhängern und belastbaren Tandemanhängern über Autotransporter und Fahrzeugtransporter bis hin zu Kippern, Kofferanhängern, Bootstransportern, Baumaschinentransportern und individuellen Spezialanhängern. Ergänzt wird das Angebot durch professionelle Nutzfahrzeugaufbauten wie Plateau-, Planen-, Koffer- und Doppelstockaufbauten. Beliebte Modellreihen wie TA-NO Formula, Scorpio, Trio, Uno oder Swiss haben sich bei Profis wie privaten Nutzern gleichermaßen bewährt.",
        ],
      },
      {
        heading: "Warum TA-NO Anhänger?",
        paragraphs: [
          "TA-NO steht für Qualität, Innovation und Langlebigkeit – bei attraktiven Preisen und niedrigen Unterhalts- und Betriebskosten. Dafür sprechen klare Argumente:",
        ],
        bullets: [
          "Über 25 Jahre Erfahrung im Anhängerbau – einer der ältesten Hersteller der Branche",
          "Fertigung nach dem Qualitätsmanagementsystem ISO 9001:2015",
          "EG-Typgenehmigung (EC-COC) für zugelassene Modelle",
          "Bis zu 3 Jahre Garantie sowie kostenloser Service während der Garantiezeit",
          "Tempo-100-Tauglichkeit für viele Modelle – für zügiges und sicheres Reisen auf der Autobahn",
          "Kontinuierliche Investitionen in moderne Fertigung und geschultes Fachpersonal",
        ],
      },
      {
        heading: "Individuell konfiguriert – ganz nach Ihren Anforderungen",
        paragraphs: [
          "Kein Transportauftrag gleicht dem anderen. Deshalb setzt TA-NO auf Personalisierung: Zahlreiche Modelle lassen sich mit einer Vielzahl an Konfigurationen und Ausstattungsoptionen exakt an Ihre Bedürfnisse anpassen. So erhalten Sie einen Anhänger, der genau zu Ihrem Einsatz passt – robust, zuverlässig und wirtschaftlich im Betrieb.",
        ],
      },
      {
        heading: "Jetzt TA-NO Anhänger entdecken",
        paragraphs: [
          "Entdecken Sie die Anhänger und Aufbauten von TA-NO und finden Sie das Modell, das Ihren Transport bewegt. Sprechen Sie uns an – wir beraten Sie gern persönlich und finden gemeinsam die passende Lösung für Ihre Anforderungen.",
        ],
      },
    ],
    ctas: [
      { label: "Modelle ansehen", href: "#modelle", primary: true },
      { label: "Jetzt beraten lassen", href: "/kontakt" },
    ],
    faq: [
      {
        question: "Welche TA-NO Anhänger kann ich bei elbe-trailer kaufen?",
        answer:
          "Wir führen TA-NO Autotransporter und -Maschinentransporter in verschiedenen Größen und Nutzlastklassen. Die aktuell verfügbaren Modelle sehen Sie in der Übersicht auf dieser Seite — jedes Inserat enthält die technischen Daten und eine unverbindliche Anfragemöglichkeit.",
      },
      {
        question: "Kann ich einen TA-NO Anhänger nach Hamburg liefern lassen?",
        answer:
          "Ja. Wir liefern TA-NO Anhänger nach Hamburg und in ganz Norddeutschland. Alternativ holen Sie Ihren Anhänger direkt bei uns in 21493 Möhnsen ab — rund 30 Minuten südöstlich von Hamburg.",
      },
      {
        question: "Bekomme ich Beratung und Zubehör zu meinem TA-NO Anhänger?",
        answer:
          "Vor dem Kauf beraten wir Sie zu Nutzlast, Ladeflächenlänge und Ausstattung. Passendes Zubehör wählen Sie direkt bei der Anfrage im Konfigurator des jeweiligen Inserats aus.",
      },
    ],
  },
  temared: {
    displayName: "Temared",
    manufacturerUrl: "https://temared.com/de/",
    metaTitle: "Temared Anhänger kaufen – robuste Transporter aus Polen",
    metaDescription:
      "Temared Anhänger bei elbe-trailer: Kofferanhänger, Hochlader, Autotransporter & Kipper zu fairem Preis. Beratung & deutschlandweite Lieferung auf Anfrage.",
    heading: "Temared Anhänger – Vielseitige Transportlösungen made in Poland",
    intro: [
      "Die Marke Temared zählt zu den führenden Anhängerherstellern Europas. Seit der Gründung im Jahr 2001 hat sich das polnische Unternehmen mit durchdachten, sicheren und langlebigen Anhängern einen Namen gemacht – vom leichten Gepäckanhänger bis zum robusten Autotransporter. Entwickelt und gefertigt in Polen, stehen Temared Anhänger für Qualität, Vielseitigkeit und ein hervorragendes Preis-Leistungs-Verhältnis.",
    ],
    sections: [
      {
        heading: "Ein Anhänger für jeden Bedarf",
        paragraphs: [
          "Kaum ein Hersteller bietet ein so breites Sortiment: Mit einer enormen Modellvielfalt deckt Temared nahezu jeden Transportbedarf ab. Das Programm umfasst multifunktionale Kastenanhänger, Hochlader und Tieflader, Autotransporter und Fahrzeugtransporter, Kipper, Baumaschinen- und Baggertransporter, Bootsanhänger sowie Spezialanhänger für Motorräder und Quads. Ob für Handwerk, Bau, Gewerbe oder Freizeit – vom leichten Anhänger bis 750 kg bis zum schweren Anhänger mit 3.500 kg zulässigem Gesamtgewicht finden Sie das passende Modell.",
        ],
      },
      {
        heading: "Warum Temared Anhänger?",
        paragraphs: [
          "Temared steht für die Kombination aus solider Verarbeitung, durchdachten Details und einem attraktiven Preis. Dafür sprechen klare Argumente:",
        ],
        bullets: [
          "Einer der führenden europäischen Hersteller mit Sitz und Produktion in Polen",
          "Über 300.000 gefertigte Anhänger und mehrfach mit dem Forbes Diamond ausgezeichnet",
          "Fertigung aus feuerverzinktem Stahl für langfristigen Korrosionsschutz",
          "Ausstattung mit hochwertigen Markenachsen und -komponenten",
          "Enorme Modellvielfalt mit zahlreichen Konfigurations- und Ausstattungsoptionen",
          "Attraktives Preis-Leistungs-Verhältnis für private wie gewerbliche Nutzer",
        ],
      },
      {
        heading: "Individuell konfigurierbar",
        paragraphs: [
          "Temared setzt auf Funktionalität und Anpassbarkeit: Viele Modelle lassen sich mit passendem Zubehör und verschiedenen Optionen genau auf Ihren Einsatzzweck abstimmen – von der Bereifung über Aufbauten und Planen bis zur Tempo-100-Tauglichkeit. So erhalten Sie einen Anhänger, der zuverlässig zu Ihren Anforderungen passt.",
        ],
      },
      {
        heading: "Jetzt Temared Anhänger entdecken",
        paragraphs: [
          "Entdecken Sie die vielseitigen Anhänger von Temared und finden Sie das Modell, das zu Ihnen passt. Sprechen Sie uns an – wir beraten Sie gern und finden gemeinsam die richtige Transportlösung für Ihre Anforderungen.",
        ],
      },
    ],
    ctas: [
      { label: "Modelle ansehen", href: "#modelle", primary: true },
      { label: "Jetzt beraten lassen", href: "/kontakt" },
    ],
    faq: [
      {
        question: "Welche Temared Anhänger kann ich bei elbe-trailer kaufen?",
        answer:
          "Wir vermitteln Temared-Anhänger aus dem breiten Programm des Herstellers — z. B. Kofferanhänger, Hochlader, Autotransporter und Kipper. Die aktuell verfügbaren Modelle sehen Sie in der Übersicht auf dieser Seite.",
      },
      {
        question: "Liefert elbe-trailer Temared Anhänger deutschlandweit?",
        answer:
          "Ja. Auf Anfrage liefern wir Temared-Anhänger deutschlandweit; die Kosten richten sich nach Anhänger und Entfernung. Alternativ holen Sie Ihren Anhänger bei uns in 21493 Möhnsen ab.",
      },
      {
        question: "Sind Temared Anhänger für Handwerk und Bau geeignet?",
        answer:
          "Ja. Gerade Hochlader, Kipper und Baumaschinentransporter von Temared sind auf den robusten Einsatz in Handwerk und Bau ausgelegt. Wir beraten Sie zu Nutzlast und Ausstattung.",
      },
    ],
  },
  balhanger: {
    displayName: "Balhanger",
    manufacturerUrl: "https://balhanger.com/",
    metaTitle: "Balhanger Anhänger kaufen – Autotransporter & mehr",
    metaDescription:
      "Balhanger Anhänger bei elbe-trailer: kippbare Autotransporter, Motorrad-, Baumaschinen-, Plattform- & Bootsanhänger. Beratung & Lieferung auf Anfrage.",
    heading:
      "Balhanger Anhänger – Autotransporter und Motorradanhänger mit cleverer Technik",
    intro: [
      "Die Marke Balhanger steht für durchdachte Transportlösungen rund um den Fahrzeug- und Motorradtransport. Mit robuster Konstruktion, hochwertigen Materialien und cleverer Funktionalität überzeugen Balhanger Anhänger im professionellen Einsatz ebenso wie in der privaten Nutzung. Der Fokus liegt auf leistungsstarken Autotransportern und praktischen Motorradanhängern, die komfortables Beladen und zuverlässigen Transport miteinander verbinden.",
    ],
    sections: [
      {
        heading: "Das Balhanger Sortiment",
        paragraphs: [
          "Im Mittelpunkt stehen die kippbaren Autotransporter der Optilift-Reihe – erhältlich in verschiedenen Größen mit bis zu 3.500 kg zulässigem Gesamtgewicht und komfortablem Be- und Entladen ohne Rampen. Für den Transport größerer oder mehrerer Fahrzeuge sorgen Modelle mit langer Ladefläche wie der Trimaxlift, während der Digger als Baumaschinentransporter höhere Nutzlasten aufnimmt. Ergänzt wird das Programm durch die Motorradanhänger Moto-1 und Moto-2 – hydraulisch absenkbar, klappbar und mit sicherem Halt für Ihr Bike. Robuste Plattformanhänger und Bootsanhänger runden das Sortiment ab – für flexible Ladung und den sicheren Transport ans Wasser.",
        ],
      },
      {
        heading: "Warum Balhanger Anhänger?",
        paragraphs: [
          "Balhanger verbindet solide Technik mit praxisgerechten Details, die das Verladen erleichtern und die Lebensdauer verlängern:",
        ],
        bullets: [
          "Verschweißter, feuerverzinkter Stahlrahmen für Langlebigkeit und Korrosionsschutz",
          "Durchdachtes Beladesystem mit direktem Auffahren – Be- und Entladen ohne Rampen",
          "Kippbare Plattform, optional mit Kipphydraulik für müheloses Verladen",
          "Wartungsfreie Gummifederachsen, LED-Beleuchtung und robuste Serienausstattung",
          "Motorradanhänger mit hydraulischer Absenkung, Motorradwippe und pulverbeschichtetem Rahmen",
          "Hohe Tragfähigkeit – ideal für Pkw, SUV, kleinere Nutzfahrzeuge und Zweiräder",
        ],
      },
      {
        heading: "Individuell konfigurierbar",
        paragraphs: [
          "Balhanger Anhänger lassen sich mit zahlreichen Optionen an Ihren Einsatz anpassen – von Kipphydraulik über Elektrowinde und Aluminium-Zwischenboden bis zur 100-km/h-Ausführung (Tempo 100). So stellen Sie sich einen Anhänger zusammen, der genau zu Ihren Transportaufgaben passt.",
        ],
      },
      {
        heading: "Jetzt Balhanger Anhänger entdecken",
        paragraphs: [
          "Entdecken Sie die Autotransporter und Motorradanhänger von Balhanger und finden Sie das passende Modell für Ihren sicheren Transport. Sprechen Sie uns an – wir beraten Sie gern.",
        ],
      },
    ],
    ctas: [
      { label: "Modelle ansehen", href: "#modelle", primary: true },
      { label: "Jetzt beraten lassen", href: "/kontakt" },
    ],
    faq: [
      {
        question: "Wofür sind Balhanger Anhänger bekannt?",
        answer:
          "Balhanger ist vor allem für seine kippbaren Autotransporter (z. B. Optilift und Trimaxlift) aus feuerverzinktem Stahl bekannt. Daneben gibt es Motorrad-, Baumaschinen-, Plattform- und Bootsanhänger.",
      },
      {
        question: "Kann ich einen Balhanger Anhänger liefern lassen?",
        answer:
          "Ja. Auf Anfrage liefern wir Balhanger-Anhänger deutschlandweit; der Preis richtet sich nach Modell und Entfernung. Alternativ holen Sie ihn bei uns in 21493 Möhnsen ab.",
      },
      {
        question: "Welche Balhanger Modelle sind verfügbar?",
        answer:
          "Die aktuell verfügbaren Balhanger-Modelle sehen Sie in der Übersicht auf dieser Seite. Jedes Inserat enthält die technischen Daten und eine unverbindliche Anfragemöglichkeit.",
      },
    ],
  },
};

/** Slug einer Marke (identische Normalisierung wie bei Kategorien/Inseraten). */
export function brandSlug(brand: string): string {
  return normalizeSlug(brand);
}

/** Anzeige-Name: bevorzugt die kuratierte Schreibweise, sonst die Rohform. */
export function brandDisplayName(storedValue: string, slug: string): string {
  return BRAND_META[slug]?.displayName ?? storedValue.trim();
}

/** Redaktionell gepflegt = darf (bei ausreichendem Bestand) indexiert werden. */
export function brandHasAuthoredContent(slug: string): boolean {
  return (BRAND_META[slug]?.intro?.length ?? 0) > 0;
}

export type PublishedBrand = {
  slug: string;
  /** Erste im Bestand gefundene Roh-Schreibweise (Anzeige-Fallback/Debug). */
  storedValue: string;
  displayName: string;
  /** Anzahl veröffentlichter Kauf-Inserate (kauf + kauf_und_miete) dieser Marke. */
  kaufCount: number;
};

/**
 * Alle Marken mit veröffentlichten Kauf-Inseraten, über den Slug case-insensitiv
 * zusammengefasst. Sortiert nach Bestand, dann Name.
 */
export async function getPublishedBrands(
  supabase: SupabaseClient,
): Promise<PublishedBrand[]> {
  const { data } = await supabase
    .from("listings")
    .select("brand")
    .eq("published", true)
    .in("listing_type", ["kauf", "kauf_und_miete"]);

  const map = new Map<string, PublishedBrand>();
  for (const row of (data ?? []) as Array<{ brand: string | null }>) {
    const raw = (row.brand ?? "").trim();
    if (!raw) continue;
    const slug = brandSlug(raw);
    if (!slug) continue;
    const existing = map.get(slug);
    if (existing) {
      existing.kaufCount += 1;
    } else {
      map.set(slug, {
        slug,
        storedValue: raw,
        displayName: brandDisplayName(raw, slug),
        kaufCount: 1,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) =>
      b.kaufCount - a.kaufCount ||
      a.displayName.localeCompare(b.displayName, "de"),
  );
}

/** Findet eine Marke anhand ihres Slugs (case-insensitiv über alle Roh-Schreibweisen). */
export async function resolvePublishedBrand(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublishedBrand | null> {
  const normalized = normalizeSlug(slug);
  const brands = await getPublishedBrands(supabase);
  return brands.find((b) => b.slug === normalized) ?? null;
}

/** Slugs aller redaktionell gepflegten Marken (BRAND_META mit intro-Text). */
export function authoredBrandSlugs(): string[] {
  return Object.keys(BRAND_META).filter((slug) => brandHasAuthoredContent(slug));
}

/**
 * Darf diese Marke eine eigene, indexierbare /marke/[slug]-Seite bekommen?
 * Kriterium: redaktioneller Text vorhanden — UNABHÄNGIG vom aktuellen Bestand.
 * So bleiben gepflegte Marken auch ohne Inserat sichtbar (die Seite zeigt dann
 * einen Anfrage-Hinweis statt Inseraten) und können für die Marken-Suche ranken.
 */
export function isIndexableBrand(brand: Pick<PublishedBrand, "slug">): boolean {
  return brandHasAuthoredContent(brand.slug);
}

/**
 * Führt die Bestands-Marken mit allen redaktionell gepflegten Marken zusammen —
 * inklusive gepflegter Marken OHNE aktuellen Bestand (kaufCount = 0). Ergebnis:
 * die Liste der indexierbaren Markenseiten für Footer, Sitemap und Marken-Hub.
 * Sortiert nach Bestand, dann Name.
 */
export function mergeAuthoredBrands(
  published: PublishedBrand[],
): PublishedBrand[] {
  const bySlug = new Map(published.map((b) => [b.slug, b]));
  return authoredBrandSlugs()
    .map(
      (slug): PublishedBrand =>
        bySlug.get(slug) ?? {
          slug,
          storedValue: BRAND_META[slug].displayName,
          displayName: BRAND_META[slug].displayName,
          kaufCount: 0,
        },
    )
    .sort(
      (a, b) =>
        b.kaufCount - a.kaufCount ||
        a.displayName.localeCompare(b.displayName, "de"),
    );
}

/** Alle indexierbaren Markenseiten (gepflegte Marken inkl. bestandsloser). */
export async function getIndexableBrands(
  supabase: SupabaseClient,
): Promise<PublishedBrand[]> {
  return mergeAuthoredBrands(await getPublishedBrands(supabase));
}
