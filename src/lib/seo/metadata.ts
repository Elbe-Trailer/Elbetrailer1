import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

const SITE_NAME = "elbe-trailer";

/** Marken-Vorschaubild als Fallback für Seiten ohne eigenes Bild. */
const DEFAULT_OG_IMAGE_PATH = "/hero/hero-trailer.png";

type BuildPageMetadataInput = {
  title: string;
  /**
   * Title als absoluten Wert ausgeben (ohne das "%s | elbe-trailer"-Template),
   * z. B. für kuratierte SEO-Titles mit fester Zeichengrenze.
   */
  titleAbsolute?: boolean;
  description?: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  titleAbsolute = false,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  // Eigenes Bild bevorzugen, sonst das Marken-Fallback verwenden, damit jede
  // Seite ein Social-Vorschaubild hat.
  const resolvedImage = image ?? absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const images = [{ url: resolvedImage, alt: title }];

  return {
    title: titleAbsolute ? { absolute: title } : title,
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
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [resolvedImage],
    },
  };
}

export { SITE_NAME };
