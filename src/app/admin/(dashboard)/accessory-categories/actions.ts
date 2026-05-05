"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SaveAccessoryCategoryState = undefined | { ok: false; error: string };

export async function saveAccessoryCategory(
  _prev: SaveAccessoryCategoryState,
  formData: FormData,
): Promise<SaveAccessoryCategoryState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const sort_order =
    Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const is_active = formData.get("is_active") === "on";
  const allows_multiple = String(formData.get("allows_multiple") ?? "true") !== "false";

  if (!name) {
    return { ok: false, error: "Name ist ein Pflichtfeld." };
  }

  if (!id) {
    const { error } = await supabase.from("accessory_categories").insert({
      name,
      sort_order,
      is_active,
      allows_multiple,
    });
    if (error) {
      console.error(error);
      return { ok: false, error: "Anlegen fehlgeschlagen." };
    }
    revalidatePath("/admin/accessory-categories");
    redirect(withAdminSavedParam("/admin/accessory-categories"));
  }

  const { error } = await supabase
    .from("accessory_categories")
    .update({ name, sort_order, is_active, allows_multiple })
    .eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/accessory-categories");
  redirect(withAdminSavedParam("/admin/accessory-categories"));
}

export async function deleteAccessoryCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("accessory_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    redirect("/admin/accessory-categories?error=delete-failed");
  }

  revalidatePath("/admin/accessory-categories");
  redirect("/admin/accessory-categories");
}
