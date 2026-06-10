import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseUrl } from "@/lib/supabase/public-env";

/** Server-only client that bypasses RLS for trusted write operations. */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createSupabaseClient(getPublicSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
