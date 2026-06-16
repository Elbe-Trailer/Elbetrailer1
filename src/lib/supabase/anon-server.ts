import { createClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/public-env";

/** Stateless anon client for cached public reads (no cookies, respects RLS). */
export function createAnonServerClient() {
  return createClient(getPublicSupabaseUrl(), getPublicSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
