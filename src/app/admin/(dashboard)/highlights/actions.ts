"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setHighlight(formData: FormData) {
  const { supabase } = await requireAdmin();
  const listing_id = String(formData.get("listing_id") ?? "");
  const position = Number.parseInt(String(formData.get("position") ?? ""), 10);
  if (!listing_id || !Number.isFinite(position)) {
    redirect("/admin/highlights");
  }
  await supabase.from("listing_highlights").upsert({
    listing_id,
    position,
  });
  revalidatePath("/");
  revalidatePath("/admin/highlights");
  redirect(withAdminSavedParam("/admin/highlights"));
}

export async function deleteHighlight(formData: FormData) {
  const listing_id = String(formData.get("listing_id") ?? "");
  if (!listing_id) return;
  const { supabase } = await requireAdmin();
  await supabase.from("listing_highlights").delete().eq("listing_id", listing_id);
  revalidatePath("/");
  revalidatePath("/admin/highlights");
  redirect("/admin/highlights");
}
