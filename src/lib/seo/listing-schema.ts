import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
import { COMPANY } from "@/lib/company";

/** Feste @id der Firmen-Entität — alle Seiten referenzieren dieselbe Organization. */
function organizationId(): string {
  return `${absoluteUrl("/")}#organization`;
}

/** Feste @id der WebSite-Entität. */
function websiteId(): string {
  return `${absoluteUrl("/")}#website`;
}

/**
 * Referenz auf die zentrale Organization-Entität (statt jeweils eine eigene,
 * unverbundene Organization-Node zu erzeugen). Bindet Offer.seller,
 * WebSite.publisher etc. an die vollständige LocalBusiness-Node der Startseite.
 */
function organizationRef() {
  return {
    "@type": "Organization" as const,
    "@id": organizationId(),
    name: COMPANY.name,
  };
}

/**
 * Standard-Einzugsgebiet als schema.org areaServed. Einzelne Standortseiten
 * können dies über {@link buildLocalBusinessSchema} überschreiben.
 */
export const DEFAULT_AREA_SERVED: Array<{ "@type": string; name: string }> = [
  { "@type": "City", name: "Hamburg" },
  { "@type": "AdministrativeArea", name: "Schleswig-Holstein" },
  { "@type": "AdministrativeArea", name: "Niedersachsen" },
  { "@type": "AdministrativeArea", name: "Mecklenburg-Vorpommern" },
  { "@type": "AdministrativeArea", name: "Herzogtum Lauenburg" },
];

type ListingForSchema = {
  slug: string;
  title: string;
  brand: string | null;
  description: string | null;
  price_cents: number | null;
  daily_rate_cents: number | null;
  listing_type: "kauf" | "miete" | "kauf_und_miete";
  gallery_paths: string[];
  article_number?: string | null;
  condition?: string | null;
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Bildet die freie Zustandsangabe auf ein schema.org itemCondition ab. */
function mapItemCondition(condition: string | null | undefined): string | null {
  if (!condition) return null;
  const c = condition.toLowerCase();
  if (c.includes("neu")) return "https://schema.org/NewCondition";
  if (c.includes("gebraucht") || c.includes("occasion")) {
    return "https://schema.org/UsedCondition";
  }
  if (c.includes("vorführ") || c.includes("vorfuehr") || c.includes("demo")) {
    return "https://schema.org/RefurbishedCondition";
  }
  return null;
}

export function buildListingProductSchema(
  listing: ListingForSchema,
  imageUrls: string[],
) {
  const url = absoluteUrl(listingPublicPath(listing.slug));
  const isRental =
    listing.listing_type === "miete" ||
    (listing.listing_type === "kauf_und_miete" && listing.daily_rate_cents != null);

  const priceCents = isRental ? listing.daily_rate_cents : listing.price_cents;

  const itemCondition = mapItemCondition(listing.condition);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url,
    ...(itemCondition ? { itemCondition } : {}),
    seller: organizationRef(),
  };

  if (priceCents != null) {
    offer.price = formatPrice(priceCents);
    if (isRental) {
      offer.priceSpecification = {
        "@type": "UnitPriceSpecification",
        price: formatPrice(priceCents),
        priceCurrency: "EUR",
        unitText: "DAY",
      };
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    ...(listing.brand ? { brand: { "@type": "Brand", name: listing.brand } } : {}),
    ...(listing.article_number ? { sku: listing.article_number } : {}),
    ...(itemCondition ? { itemCondition } : {}),
    ...(listing.description ? { description: listing.description } : {}),
    ...(imageUrls.length ? { image: imageUrls } : {}),
    offers: offer,
  };
}

/**
 * BreadcrumbList für Google-Rich-Results. `items` in Reihenfolge Start → aktuell,
 * jeweils mit absolutem `url`.
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** WebSite-Schema als Entitäts-Anker für die Domain. */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(),
    name: COMPANY.name,
    url: absoluteUrl("/"),
    inLanguage: "de-DE",
    publisher: organizationRef(),
  };
}

/**
 * LocalBusiness/AutoDealer-Schema mit Adresse, Öffnungszeiten und Kontakt.
 * Stärkstes Signal für lokale Google-Sichtbarkeit (Maps/Knowledge-Panel).
 * Feste `@id`, damit alle Seiten dieselbe Entität referenzieren.
 */
export function buildLocalBusinessSchema(options?: {
  /** Überschreibt das Einzugsgebiet (z. B. auf einer Standort-Landingpage). */
  areaServed?: Array<{ "@type": string; name: string }>;
}) {
  const areaServed = options?.areaServed ?? DEFAULT_AREA_SERVED;
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": organizationId(),
    name: COMPANY.legalName,
    alternateName: COMPANY.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(COMPANY.logoPath),
    image: absoluteUrl(COMPANY.logoPath),
    telephone: COMPANY.phoneTel,
    email: COMPANY.email,
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      postalCode: COMPANY.address.postalCode,
      addressLocality: COMPANY.address.locality,
      addressRegion: COMPANY.address.region,
      addressCountry: COMPANY.address.country,
    },
    // GeoCoordinates nur ausgeben, wenn echte Werte aus dem Google-
    // Unternehmensprofil hinterlegt sind (siehe COMPANY.geo) — niemals raten.
    ...(COMPANY.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: COMPANY.geo.latitude,
            longitude: COMPANY.geo.longitude,
          },
        }
      : {}),
    ...(COMPANY.mapUrl ? { hasMap: COMPANY.mapUrl } : {}),
    ...(COMPANY.sameAs.length ? { sameAs: COMPANY.sameAs } : {}),
    areaServed,
    openingHoursSpecification: COMPANY.openingHours.map((spec) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: spec.days,
      opens: spec.opens,
      closes: spec.closes,
    })),
  };
}

type BlogPostForSchema = {
  slug: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  published_at: string | null;
  updated_at?: string | null;
  cover_image_path: string | null;
};

export function buildBlogPostingSchema(
  post: BlogPostForSchema,
  imageUrl: string | null,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.author ? { author: { "@type": "Person", name: post.author } } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    ...(post.updated_at ?? post.published_at
      ? { dateModified: post.updated_at ?? post.published_at }
      : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    publisher: {
      "@type": "Organization",
      "@id": organizationId(),
      name: COMPANY.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(COMPANY.logoPath),
      },
    },
  };
}

/**
 * ItemList für Sammelseiten (Kategorie-, Marken-, Übersichtsseiten). Signalisiert
 * Google die enthaltenen Produkte in Reihenfolge. `items` in Anzeige-Reihenfolge.
 */
export function buildItemListSchema(
  items: Array<{ url: string; name: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  };
}

/**
 * CollectionPage-Entität für Sammelseiten. `about` bindet z. B. eine Marken-
 * seite an die Brand-Entität. Verknüpft die Seite mit WebSite & Organization.
 */
export function buildCollectionPageSchema(input: {
  name: string;
  url: string;
  description?: string;
  about?: { "@type": "Brand"; name: string; sameAs?: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.about ? { about: input.about } : {}),
    isPartOf: { "@type": "WebSite", "@id": websiteId() },
    publisher: organizationRef(),
  };
}

/**
 * FAQPage aus Frage/Antwort-Paaren. Hinweis: FAQ-Rich-Results zeigt Google
 * inzwischen stark eingeschränkt an — dient hier primär als Entitäts-/AI-
 * Overview-Kontext, nicht als garantiertes SERP-Feature.
 */
export function buildFaqPageSchema(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
