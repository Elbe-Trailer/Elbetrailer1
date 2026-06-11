export function listingPublicPath(slug: string, query = ""): string {
  const base = `/inserat/${slug}`;
  if (!query) return base;
  return query.startsWith("?") ? `${base}${query}` : `${base}?${query}`;
}
