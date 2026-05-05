"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminLoginState = { errKey: string } | null;

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { errKey: "missing" };
  }

  const supabase = await createClient();
  const { data: authData, error: authErr } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authErr) {
    const msg = authErr.message ?? "";
    const isNetwork =
      /fetch failed|network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|certificate|SSL|Failed to fetch/i.test(
        msg,
      );
    return { errKey: isNetwork ? "network" : "auth" };
  }

  const user = authData.user;
  if (!user) {
    return { errKey: "auth" };
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (pErr || !profile?.is_admin) {
    await supabase.auth.signOut();
    return { errKey: "forbidden" };
  }

  redirect("/admin");
}
