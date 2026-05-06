"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteInquiry(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { supabase } = await requireAdmin();
  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}

export async function deleteContactInquiry(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { supabase } = await requireAdmin();
  await supabase.from("contact_inquiries").delete().eq("id", id);
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}

const ALLOWED_STATUSES = new Set(["neu", "in_bearbeitung", "abgeschlossen"]);

export async function updateInquiryStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !ALLOWED_STATUSES.has(status)) return;
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}

export async function updateContactInquiryStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !ALLOWED_STATUSES.has(status)) return;
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("contact_inquiries")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error(error);
    return;
  }
  revalidatePath("/admin/inquiries");
  redirect("/admin/inquiries");
}
