/**
 * Kuratierte Standort-/Einzugsgebietsseiten (/anhaenger-kaufen/[ort]).
 *
 * elbe-trailer hat EINEN physischen Standort (Möhnsen). Diese Seiten sind daher
 * bewusst redaktionelle Service-Area-Landingpages — kein Geo-Filter auf Inserate
 * (dafür gibt es keine Standortspalte). Jede Seite MUSS eigene, ortsspezifische
 * Inhalte tragen (intro, Anfahrt, Liefer-Hinweis, FAQ), damit keine
 * Doorway-/Thin-Content-Seiten entstehen — die Pflichtfelder erzwingen das über
 * TypeScript: eine halb leere Area lässt sich gar nicht erst anlegen.
 *
 * Phase 1 (unten): Hamburg, Norddeutschland (Hub), Schleswig-Holstein,
 * Herzogtum Lauenburg. Weitere Orte (Geesthacht, Schwarzenbek, Reinbek,
 * Bergedorf, Lauenburg, Lüneburg …) erst mit ebenso eigenem Text ergänzen.
 */

export type ServiceAreaFaq = { question: string; answer: string };

export type ServiceArea = {
  /** URL-Segment, z. B. "hamburg" → /anhaenger-kaufen/hamburg */
  slug: string;
  /** Ort/Region für Fließtext & Breadcrumb, z. B. "Hamburg". */
  city: string;
  /** Bundesland/Region (Kontext). */
  region: string;
  /** H1 & Title-Basis. */
  headline: string;
  /** Meta-Description (eigen je Seite). */
  metaDescription: string;
  /** Einzigartiger Einleitungstext (Absätze) — PFLICHT. */
  intro: string[];
  /** Anfahrtsbeschreibung ab Möhnsen — PFLICHT. */
  drivingRoute: string;
  /** Liefer-Hinweis für diese Region — PFLICHT. */
  deliveryNote: string;
  /** Lokale FAQ — PFLICHT (mind. 1 Eintrag). */
  faq: ServiceAreaFaq[];
  /** schema.org areaServed (City/AdministrativeArea) für diese Seite. */
  areaServed: Array<{ "@type": string; name: string }>;
  /** Ungefähre Fahrzeit ab Möhnsen in Minuten (optional; für Region-Hubs leer). */
  driveTimeMin?: number;
  /** Hub-Seiten verlinken auf untergeordnete Orte. */
  childSlugs?: string[];
};

const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "hamburg",
    city: "Hamburg",
    region: "Metropolregion Hamburg",
    headline: "Anhänger kaufen in Hamburg",
    metaDescription:
      "Anhänger kaufen in Hamburg — PKW-Anhänger, Autotransporter & Kipper bei elbe-trailer. Beratung, Zubehör und Lieferung nach Hamburg. Standort 30 Min. südöstlich.",
    intro: [
      "Sie suchen einen Anhänger in Hamburg? Bei elbe-trailer kaufen Sie PKW-Anhänger, Autotransporter, Kipper und mehr — mit persönlicher Beratung und technischer Übergabe. Unser Standort in Möhnsen liegt rund 30 Minuten südöstlich der Hamburger Innenstadt, direkt am Rand der Metropolregion.",
      "Ob Sie aus Bergedorf, Harburg, Wandsbek oder der Innenstadt kommen: Sie erreichen uns bequem über die A24 und A25. Auf Wunsch liefern wir Ihren Anhänger auch direkt nach Hamburg.",
    ],
    drivingRoute:
      "Von Hamburg über die A24 Richtung Berlin bis zur Anschlussstelle Witzhave/Reinbek, dann weiter nach Möhnsen — je nach Stadtteil rund 30–40 Minuten.",
    driveTimeMin: 35,
    deliveryNote:
      "Lieferung nach Hamburg auf Anfrage — wir liefern deutschlandweit; der Preis richtet sich nach Anhänger und Entfernung. Alternativ Abholung bei uns in Möhnsen.",
    faq: [
      {
        question: "Kann ich meinen Anhänger in Hamburg abholen oder wird geliefert?",
        answer:
          "Sie holen Ihren Anhänger bei uns in Möhnsen ab (rund 30 Minuten von der Hamburger Innenstadt) oder wir liefern ihn gegen Aufpreis nach Hamburg. Den Wunsch geben Sie einfach in der Anfrage an.",
      },
      {
        question: "Welche Anhänger sind für den Einsatz in Hamburg beliebt?",
        answer:
          "In der Stadt gefragt sind wendige PKW-Anhänger und Kofferanhänger für Umzüge und Transporte sowie Autotransporter für den Fahrzeughandel. Alle verfügbaren Modelle sehen Sie in der Übersicht.",
      },
      {
        question: "Bekomme ich in Hamburg auch Beratung und Zubehör?",
        answer:
          "Ja. Wir beraten Sie telefonisch und vor Ort zu Nutzlast, Größe und Ausstattung und stellen passendes Zubehör zusammen.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Hamburg" }],
  },
  {
    slug: "norddeutschland",
    city: "Norddeutschland",
    region: "Norddeutschland",
    headline: "Anhänger kaufen in Norddeutschland",
    metaDescription:
      "Anhänger kaufen in Norddeutschland — elbe-trailer liefert in Schleswig-Holstein, Hamburg, Niedersachsen und Mecklenburg-Vorpommern. Beratung, Zubehör, Abholung.",
    intro: [
      "elbe-trailer ist Ihr Anhänger-Händler für ganz Norddeutschland. Von unserem Standort in Möhnsen (Kreis Herzogtum Lauenburg) aus beliefern wir Kundinnen und Kunden in Schleswig-Holstein, Hamburg, Niedersachsen und Mecklenburg-Vorpommern.",
      "Vom kleinen PKW-Anhänger bis zum Autotransporter und Maschinentransporter finden Sie bei uns die passende Transportlösung — mit Beratung, technischer Übergabe und Zubehör. Wählen Sie unten Ihre Region oder sehen Sie sich direkt alle Anhänger an.",
    ],
    drivingRoute:
      "Zentral gelegen zwischen Hamburg und Lübeck, mit schneller Anbindung an die A24, A1 und A25 — gut erreichbar aus dem gesamten norddeutschen Raum.",
    deliveryNote:
      "Wir liefern deutschlandweit auf Anfrage — die Kosten richten sich nach Anhänger und Entfernung. Alternativ holen Sie Ihren Anhänger in Möhnsen ab.",
    childSlugs: ["hamburg", "schleswig-holstein", "herzogtum-lauenburg"],
    faq: [
      {
        question: "In welche Regionen liefert elbe-trailer?",
        answer:
          "Wir liefern in ganz Norddeutschland — insbesondere Schleswig-Holstein, Hamburg, Niedersachsen und Mecklenburg-Vorpommern. Alternativ holen Sie Ihren Anhänger direkt bei uns in Möhnsen ab.",
      },
      {
        question: "Lohnt sich die Anfahrt aus Norddeutschland?",
        answer:
          "Unser Standort liegt verkehrsgünstig an der A24 zwischen Hamburg und Lübeck. Viele Kundinnen und Kunden verbinden die Abholung mit der Beratung vor Ort; auf Wunsch liefern wir.",
      },
    ],
    areaServed: [
      { "@type": "City", name: "Hamburg" },
      { "@type": "AdministrativeArea", name: "Schleswig-Holstein" },
      { "@type": "AdministrativeArea", name: "Niedersachsen" },
      { "@type": "AdministrativeArea", name: "Mecklenburg-Vorpommern" },
    ],
  },
  {
    slug: "schleswig-holstein",
    city: "Schleswig-Holstein",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen in Schleswig-Holstein",
    metaDescription:
      "Anhänger kaufen in Schleswig-Holstein — elbe-trailer in Möhnsen (Kreis Herzogtum Lauenburg): PKW-Anhänger, Kipper, Autotransporter. Beratung, Zubehör, Lieferung.",
    intro: [
      "elbe-trailer sitzt mitten in Schleswig-Holstein: in Möhnsen im Kreis Herzogtum Lauenburg, nahe Schwarzenbek und Geesthacht. Als Anhänger-Händler in SH bieten wir Kauf, Vermietung, Beratung und Zubehör aus einer Hand.",
      "Ob aus Lübeck, Lauenburg, Ratzeburg, Mölln oder dem Hamburger Rand — Sie erreichen uns schnell über die A24. Wir führen PKW-Anhänger, Kipper, Autotransporter und mehr.",
    ],
    drivingRoute:
      "Aus dem südlichen Schleswig-Holstein über die A24 bis Möhnsen; aus Lübeck über die A1/B207 Richtung Herzogtum Lauenburg.",
    deliveryNote:
      "Lieferung innerhalb Schleswig-Holsteins und deutschlandweit auf Anfrage — der Preis hängt von Anhänger und Entfernung ab. Alternativ bequeme Abholung bei uns.",
    faq: [
      {
        question: "Wo genau sitzt elbe-trailer in Schleswig-Holstein?",
        answer:
          "Unser Standort ist in 21493 Möhnsen, Kreis Herzogtum Lauenburg — verkehrsgünstig an der A24 zwischen Hamburg und Lübeck.",
      },
      {
        question: "Kann ich meinen Anhänger in Schleswig-Holstein liefern lassen?",
        answer:
          "Ja, gegen Aufpreis liefern wir innerhalb Schleswig-Holsteins. Alternativ holen Sie Ihren Anhänger direkt bei uns in Möhnsen ab.",
      },
    ],
    areaServed: [
      { "@type": "AdministrativeArea", name: "Schleswig-Holstein" },
    ],
  },
  {
    slug: "herzogtum-lauenburg",
    city: "Kreis Herzogtum Lauenburg",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen im Kreis Herzogtum Lauenburg",
    metaDescription:
      "Anhänger-Händler im Kreis Herzogtum Lauenburg: elbe-trailer in Möhnsen, zwischen Schwarzenbek, Geesthacht und Lauenburg. Kauf, Miete, Beratung, Zubehör.",
    intro: [
      "elbe-trailer ist Ihr Anhänger-Händler direkt im Kreis Herzogtum Lauenburg. Unser Standort in Möhnsen liegt zwischen Schwarzenbek, Geesthacht und Lauenburg — kurze Wege für alle aus der Region.",
      "Hier kaufen und mieten Sie PKW-Anhänger, Kipper, Autotransporter und Maschinentransporter mit persönlicher Beratung. Reinschauen, ansehen, anfragen — ohne lange Anfahrt.",
    ],
    drivingRoute:
      "Zentral im Kreis gelegen: aus Schwarzenbek, Geesthacht, Lauenburg, Mölln oder Ratzeburg in wenigen Minuten bis rund einer Viertelstunde erreichbar.",
    driveTimeMin: 15,
    deliveryNote:
      "Im Kreis Herzogtum Lauenburg liefern wir besonders unkompliziert; deutschlandweite Lieferung ist auf Anfrage ebenfalls möglich.",
    faq: [
      {
        question: "Gibt es einen Anhänger-Händler im Kreis Herzogtum Lauenburg?",
        answer:
          "Ja — elbe-trailer in Möhnsen, zwischen Schwarzenbek, Geesthacht und Lauenburg. Kauf, Miete, Beratung und Zubehör aus einer Hand.",
      },
      {
        question: "Aus welchen Orten kommen Ihre Kundinnen und Kunden?",
        answer:
          "Vor allem aus Schwarzenbek, Geesthacht, Lauenburg, Mölln, Ratzeburg und dem östlichen Hamburger Rand — die Wege zu uns sind kurz.",
      },
    ],
    areaServed: [
      { "@type": "AdministrativeArea", name: "Herzogtum Lauenburg" },
      { "@type": "City", name: "Schwarzenbek" },
      { "@type": "City", name: "Geesthacht" },
      { "@type": "City", name: "Lauenburg/Elbe" },
      { "@type": "City", name: "Mölln" },
    ],
  },
  {
    slug: "schwarzenbek",
    city: "Schwarzenbek",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen in Schwarzenbek",
    metaDescription:
      "Anhänger kaufen in Schwarzenbek — elbe-trailer liegt direkt nebenan in Möhnsen. PKW-Anhänger, Autotransporter & Kipper mit Beratung, Zubehör und kurzer Anfahrt.",
    intro: [
      "elbe-trailer ist Ihr Anhänger-Händler praktisch vor der Haustür von Schwarzenbek: Unser Standort in Möhnsen liegt nur wenige Minuten entfernt. Hier kaufen und mieten Sie PKW-Anhänger, Autotransporter, Kipper und mehr — mit persönlicher Beratung ohne lange Wege.",
      "Kurz vorbeikommen, Anhänger ansehen, anfragen: Für Schwarzenbek und Umgebung sind wir der naheliegende Ansprechpartner rund um den Anhänger.",
    ],
    drivingRoute:
      "Von Schwarzenbek in wenigen Minuten über die B207/L200 nach Möhnsen — rund 10 Minuten Fahrt.",
    driveTimeMin: 10,
    deliveryNote:
      "Für Schwarzenbek liefern wir besonders unkompliziert; deutschlandweite Lieferung ist auf Anfrage ebenfalls möglich.",
    faq: [
      {
        question: "Wie weit ist elbe-trailer von Schwarzenbek entfernt?",
        answer:
          "Nur wenige Minuten: Unser Standort in Möhnsen liegt direkt nordwestlich von Schwarzenbek, rund 10 Minuten Fahrt.",
      },
      {
        question: "Kann ich in Schwarzenbek einen Anhänger mieten und kaufen?",
        answer:
          "Ja, beides. Wir bieten Kauf und Vermietung sowie Beratung und Zubehör aus einer Hand — nur eine kurze Anfahrt von Schwarzenbek entfernt.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Schwarzenbek" }],
  },
  {
    slug: "geesthacht",
    city: "Geesthacht",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen in Geesthacht",
    metaDescription:
      "Anhänger kaufen in Geesthacht — elbe-trailer in Möhnsen, nur rund 15 Minuten entfernt. PKW-Anhänger, Autotransporter, Kipper. Beratung, Zubehör, Lieferung auf Anfrage.",
    intro: [
      "Für Geesthacht ist elbe-trailer der Anhänger-Händler in der Nähe: Von unserem Standort in Möhnsen erreichen Sie uns in rund einer Viertelstunde. Wir führen PKW-Anhänger, Autotransporter, Kipper und Zubehör — mit persönlicher Beratung.",
      "Ob privat oder gewerblich: In Geesthacht und an der Elbe sind wir Ihr kurzer Weg zum passenden Anhänger.",
    ],
    drivingRoute:
      "Von Geesthacht über die B404/L204 Richtung Norden nach Möhnsen — rund 15 bis 20 Minuten.",
    driveTimeMin: 18,
    deliveryNote:
      "Nach Geesthacht liefern wir gern auf Anfrage; deutschlandweite Lieferung ebenfalls möglich, Preis je nach Anhänger und Entfernung.",
    faq: [
      {
        question: "Gibt es einen Anhänger-Händler in der Nähe von Geesthacht?",
        answer:
          "Ja — elbe-trailer in Möhnsen, rund 15 Minuten von Geesthacht entfernt. Kauf, Miete, Beratung und Zubehör aus einer Hand.",
      },
      {
        question: "Liefern Sie Anhänger nach Geesthacht?",
        answer:
          "Ja, auf Anfrage. Die Lieferkosten richten sich nach Anhänger und Entfernung; alternativ holen Sie bequem bei uns ab.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Geesthacht" }],
  },
  {
    slug: "reinbek",
    city: "Reinbek",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen in Reinbek",
    metaDescription:
      "Anhänger kaufen in Reinbek — elbe-trailer in Möhnsen, rund 20 Minuten über die A24. PKW-Anhänger, Autotransporter & Kipper mit Beratung, Zubehör und Lieferung auf Anfrage.",
    intro: [
      "Reinbek liegt zwischen Hamburg und unserem Standort in Möhnsen — ideal, um bei elbe-trailer den passenden Anhänger zu finden. Über die A24 sind Sie in rund 20 Minuten bei uns. Wir bieten PKW-Anhänger, Autotransporter, Kipper und Zubehör mit persönlicher Beratung.",
      "Für Reinbek und den östlichen Hamburger Rand sind wir gut erreichbar — ohne Stadtverkehr.",
    ],
    drivingRoute:
      "Von Reinbek über die A24 (Anschlussstelle Reinbek/Witzhave) Richtung Osten nach Möhnsen — rund 20 Minuten.",
    driveTimeMin: 20,
    deliveryNote:
      "Nach Reinbek liefern wir auf Anfrage; deutschlandweite Lieferung ist ebenfalls möglich, Preis je nach Anhänger und Entfernung.",
    faq: [
      {
        question: "Wie erreiche ich elbe-trailer von Reinbek aus?",
        answer:
          "Am schnellsten über die A24 Richtung Osten — in rund 20 Minuten sind Sie an unserem Standort in Möhnsen.",
      },
      {
        question: "Kann ich meinen Anhänger nach Reinbek liefern lassen?",
        answer:
          "Ja, auf Anfrage. Die Kosten richten sich nach Anhänger und Entfernung; alternativ holen Sie Ihren Anhänger bequem bei uns ab.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Reinbek" }],
  },
  {
    slug: "bergedorf",
    city: "Hamburg-Bergedorf",
    region: "Hamburg",
    headline: "Anhänger kaufen in Hamburg-Bergedorf",
    metaDescription:
      "Anhänger kaufen in Hamburg-Bergedorf — elbe-trailer in Möhnsen, rund 25 Minuten über A25/A24. PKW-Anhänger, Autotransporter, Kipper. Beratung & Lieferung auf Anfrage.",
    intro: [
      "Für den Hamburger Bezirk Bergedorf ist elbe-trailer der gut erreichbare Anhänger-Händler im nahen Umland: Von Bergedorf sind Sie über die A25/A24 in rund 25 Minuten bei uns in Möhnsen. Wir führen PKW-Anhänger, Autotransporter, Kipper und Zubehör.",
      "So verbinden Sie die Nähe zur Stadt mit persönlicher Beratung und Stellplatz direkt am Anhänger — ohne Innenstadtverkehr.",
    ],
    drivingRoute:
      "Von Bergedorf über die A25 und A24 Richtung Osten nach Möhnsen — rund 25 Minuten.",
    driveTimeMin: 25,
    deliveryNote:
      "Nach Hamburg-Bergedorf liefern wir auf Anfrage; deutschlandweite Lieferung ebenfalls möglich.",
    faq: [
      {
        question: "Ist elbe-trailer von Bergedorf aus gut erreichbar?",
        answer:
          "Ja — über die A25/A24 rund 25 Minuten bis zu unserem Standort in Möhnsen, ganz ohne Innenstadtverkehr.",
      },
      {
        question: "Liefern Sie Anhänger nach Bergedorf?",
        answer:
          "Ja, auf Anfrage. Die Kosten richten sich nach Anhänger und Entfernung.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Hamburg-Bergedorf" }],
  },
  {
    slug: "luebeck",
    city: "Lübeck",
    region: "Schleswig-Holstein",
    headline: "Anhänger kaufen in Lübeck",
    metaDescription:
      "Anhänger kaufen in Lübeck — elbe-trailer im Kreis Herzogtum Lauenburg, rund 40 Minuten über A1/A24. PKW-Anhänger, Autotransporter, Kipper. Beratung & Lieferung auf Anfrage.",
    intro: [
      "Aus Lübeck erreichen Sie elbe-trailer über die A1 und A24 in rund 40 Minuten. An unserem Standort in Möhnsen finden Sie PKW-Anhänger, Autotransporter, Kipper und Zubehör — mit persönlicher Beratung und fairen Preisen.",
      "Für Lübeck und den südöstlichen Raum bieten wir Kauf, Miete und auf Wunsch Lieferung.",
    ],
    drivingRoute:
      "Von Lübeck über die A1 Richtung Hamburg und weiter auf die A24/B207 nach Möhnsen — rund 40 Minuten.",
    driveTimeMin: 40,
    deliveryNote:
      "Nach Lübeck liefern wir auf Anfrage; deutschlandweite Lieferung ebenfalls möglich, Preis je nach Anhänger und Entfernung.",
    faq: [
      {
        question: "Lohnt sich die Fahrt von Lübeck zu elbe-trailer?",
        answer:
          "Über die A1/A24 sind Sie in rund 40 Minuten bei uns. Viele Kundinnen und Kunden verbinden die Abholung mit der Beratung vor Ort; auf Wunsch liefern wir nach Lübeck.",
      },
      {
        question: "Kann ich einen Anhänger nach Lübeck liefern lassen?",
        answer:
          "Ja, auf Anfrage. Die Lieferkosten richten sich nach Anhänger und Entfernung.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Lübeck" }],
  },
  {
    slug: "lueneburg",
    city: "Lüneburg",
    region: "Niedersachsen",
    headline: "Anhänger kaufen in Lüneburg",
    metaDescription:
      "Anhänger kaufen in Lüneburg — elbe-trailer bei Schwarzenbek, rund 35 Minuten. PKW-Anhänger, Autotransporter & Kipper mit Beratung, Zubehör und Lieferung auf Anfrage.",
    intro: [
      "Auch für Lüneburg ist elbe-trailer gut erreichbar: Über die Elbe und die A39/B209 sind Sie in rund 35 Minuten an unserem Standort in Möhnsen. Wir führen PKW-Anhänger, Autotransporter, Kipper und Zubehör mit persönlicher Beratung.",
      "Für Lüneburg und den nördlichen Raum Niedersachsens verbinden wir faire Preise mit kurzer Anfahrt.",
    ],
    drivingRoute:
      "Von Lüneburg über die A39/B209 und die Elbquerung Richtung Norden nach Möhnsen — rund 35 Minuten.",
    driveTimeMin: 35,
    deliveryNote:
      "Nach Lüneburg liefern wir auf Anfrage; deutschlandweite Lieferung ebenfalls möglich.",
    faq: [
      {
        question: "Wie weit ist elbe-trailer von Lüneburg entfernt?",
        answer:
          "Rund 35 Minuten über die A39/B209 und die Elbquerung bis zu unserem Standort in Möhnsen.",
      },
      {
        question: "Liefern Sie Anhänger nach Lüneburg?",
        answer:
          "Ja, auf Anfrage. Die Kosten richten sich nach Anhänger und Entfernung; alternativ Abholung bei uns.",
      },
    ],
    areaServed: [{ "@type": "City", name: "Lüneburg" }],
  },
];

const SERVICE_AREA_MAP = new Map(SERVICE_AREAS.map((area) => [area.slug, area]));

export function getServiceArea(slug: string): ServiceArea | null {
  return SERVICE_AREA_MAP.get(slug) ?? null;
}

export function listServiceAreas(): ServiceArea[] {
  return SERVICE_AREAS;
}

export const SERVICE_AREA_SLUGS = SERVICE_AREAS.map((area) => area.slug);
