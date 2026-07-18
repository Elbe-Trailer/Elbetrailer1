const DEFAULT_SITE_URL = "https://elbe-trailer.de";

function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(
    url,
  );
}

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    DEFAULT_SITE_URL;
  const normalized = raw.replace(/\/+$/, "");
  // Schutz für Produktion: niemals localhost/127.0.0.1 in Canonicals, Sitemap
  // oder Structured-Data ausliefern — selbst wenn die Env-Variable (z. B. aus
  // einer versehentlich mit deployten .env.local) auf eine lokale URL zeigt.
  if (process.env.NODE_ENV === "production" && isLocalUrl(normalized)) {
    return DEFAULT_SITE_URL;
  }
  return normalized;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
