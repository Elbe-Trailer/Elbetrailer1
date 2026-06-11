import { absoluteUrl } from "@/lib/site-url";
import { listingPublicPath } from "@/lib/listing-url";

type ListingForSchema = {
  slug: string;
  title: string;
  brand: string | null;
  description: string | null;
  price_cents: number | null;
  daily_rate_cents: number | null;
  listing_type: "kauf" | "miete" | "kauf_und_miete";
  gallery_paths: string[];
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
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

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url,
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
    ...(listing.description ? { description: listing.description } : {}),
    ...(imageUrls.length ? { image: imageUrls } : {}),
    offers: offer,
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "elbe-trailer",
    url: absoluteUrl("/"),
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
