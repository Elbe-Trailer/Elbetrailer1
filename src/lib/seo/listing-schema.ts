import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";
import { COMPANY } from "@/lib/company";

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
    seller: {
      "@type": "Organization",
      name: COMPANY.name,
      url: absoluteUrl("/"),
    },
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
    name: COMPANY.name,
    url: absoluteUrl("/"),
    inLanguage: "de-DE",
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
      url: absoluteUrl("/"),
    },
  };
}

/**
 * LocalBusiness/AutoDealer-Schema mit Adresse, Öffnungszeiten und Kontakt.
 * Stärkstes Signal für lokale Google-Sichtbarkeit (Maps/Knowledge-Panel).
 * Feste `@id`, damit alle Seiten dieselbe Entität referenzieren.
 */
export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${absoluteUrl("/")}#organization`,
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
      addressCountry: COMPANY.address.country,
    },
    areaServed: "DE",
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
    ...(imageUrl ? { image: imageUrl } : {}),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    publisher: {
      "@type": "Organization",
      name: "elbe-trailer",
      url: absoluteUrl("/"),
    },
  };
}
