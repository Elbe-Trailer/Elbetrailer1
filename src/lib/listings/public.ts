import { isUuid } from "@/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

export const LISTING_PUBLIC_SELECT =
  "id, slug, title, article_number, brand, description, price_cents, daily_rate_cents, condition, exterior_length_mm, exterior_width_mm, loading_length_mm, loading_width_mm, gross_weight_kg, payload_kg, empty_weight_kg, tire_size_inch, axle_count, braked, tip_function, lighting, loading_ramps, loading_area, length_mm, width_mm, height_mm, category_id, listing_type, published, gallery_paths, created_at, updated_at";

export async function getPublishedListingByParam(
  supabase: SupabaseClient,
  param: string,
) {
  if (isUuid(param)) {
    const { data } = await supabase
      .from("listings")
      .select(LISTING_PUBLIC_SELECT)
      .eq("id", param)
      .eq("published", true)
      .maybeSingle();
    return data;
  }

  const { data } = await supabase
    .from("listings")
    .select(LISTING_PUBLIC_SELECT)
    .eq("slug", param)
    .eq("published", true)
    .maybeSingle();
  return data;
}
