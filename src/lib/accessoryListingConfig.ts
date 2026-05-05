import type { AccessoryForListingConfig } from "@/types/database";

type Cat = NonNullable<AccessoryForListingConfig["accessory_categories"]>;

/** Rohdaten aus Supabase `accessories`-Select mit Join auf `accessory_categories`. */
export type RawAccessoryForListingRow = {
  id: string;
  name: string;
  article_number: string | null;
  brand: string | null;
  category_id: string | null;
  accessory_categories: Cat | Cat[] | null | undefined;
};

/** Supabase liefert FK-Joins je nach Typdefinition als Objekt oder Array. */
export function normalizeAccessoriesForListingConfig(
  rows: RawAccessoryForListingRow[] | null | undefined,
): AccessoryForListingConfig[] {
  return (rows ?? []).map((r) => {
    const c = r.accessory_categories;
    const cat = Array.isArray(c) ? (c[0] ?? null) : (c ?? null);
    return {
      id: r.id,
      name: r.name,
      article_number: r.article_number,
      brand: r.brand,
      category_id: r.category_id,
      accessory_categories: cat,
    };
  });
}
