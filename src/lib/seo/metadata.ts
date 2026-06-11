import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

const SITE_NAME = "elbe-trailer";

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: image, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "de_DE",
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images: [images[0].url] } : {}),
    },
  };
}

export { SITE_NAME };
