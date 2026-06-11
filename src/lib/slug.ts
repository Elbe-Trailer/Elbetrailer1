const UMLAUT_MAP: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  Ä: "ae",
  Ö: "oe",
  Ü: "ue",
};

export function normalizeSlug(input: string): string {
  let value = input.trim().toLowerCase();
  for (const [from, to] of Object.entries(UMLAUT_MAP)) {
    value = value.replaceAll(from, to);
  }
  return value
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  excludeSlug?: string,
): Promise<string> {
  const normalized = normalizeSlug(base);
  if (!normalized) return "";

  let candidate = normalized;
  let suffix = 2;
  while (await exists(candidate) && candidate !== excludeSlug) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
