import { listingPublicPath } from "@/lib/listing-url";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function revalidateListingById(
  supabase: SupabaseClient,
  listingId: string,
): Promise<void> {
  const { data } = await supabase
    .from("listings")
    .select("slug")
    .eq("id", listingId)
    .maybeSingle();
  if (data?.slug) {
    revalidatePath(listingPublicPath(data.slug));
  }
}
