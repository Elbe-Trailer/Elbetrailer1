"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { revalidateSiteCategories } from "@/lib/cache/revalidate-site";
import { redirect } from "next/navigation";

export type SaveCategoryState = undefined | { ok: false; error: string };

export async function saveCategory(
  _prev: SaveCategoryState,
  formData: FormData,
): Promise<SaveCategoryState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const sort_order =
    Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const is_active = formData.get("is_active") === "on";

  if (!name || !slug) {
    return { ok: false, error: "Name und Slug sind Pflichtfelder." };
  }

  if (!id) {
    const { error } = await supabase.from("categories").insert({
      name,
      slug,
      sort_order,
      is_active,
    });
    if (error) {
      console.error(error);
      return { ok: false, error: "Anlegen fehlgeschlagen (Slug eindeutig?)." };
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidateSiteCategories();
    redirect(withAdminSavedParam("/admin/categories"));
  }

  const { error } = await supabase
    .from("categories")
    .update({ name, slug, sort_order, is_active })
    .eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidateSiteCategories();
  redirect(withAdminSavedParam("/admin/categories"));
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const { count, error: countError } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    console.error(countError);
    redirect("/admin/categories?error=delete-failed");
  }
  if (count && count > 0) {
    redirect("/admin/categories?error=in-use");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error(error);
    redirect("/admin/categories?error=delete-failed");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidateSiteCategories();
  redirect("/admin/categories");
}
