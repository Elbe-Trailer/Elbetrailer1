import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (error || !profile?.is_admin) {
    redirect("/admin/login?error=forbidden");
  }
  return { supabase, user };
}

/**
 * Admin-Check für Route Handler (JSON-APIs). Anders als requireAdmin() wird
 * NICHT via redirect() umgeleitet — der Aufrufer entscheidet über die Antwort
 * (z. B. 401/403). Gibt bei Erfolg den Supabase-Client zurück, sonst null.
 */
export async function getAdminForApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { supabase, user };
}

export const getOptionalAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { supabase, user };
});
