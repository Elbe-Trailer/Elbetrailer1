"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SaveBlogCategoryState = undefined | { ok: false; error: string };

export async function saveBlogCategory(
  _prev: SaveBlogCategoryState,
  formData: FormData,
): Promise<SaveBlogCategoryState> {
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
    const { error } = await supabase.from("blog_categories").insert({
      name,
      slug,
      sort_order,
      is_active,
    });
    if (error) {
      console.error(error);
      return {
        ok: false,
        error: "Anlegen fehlgeschlagen (Slug eindeutig?).",
      };
    }
    revalidatePath("/admin/blog/categories");
    revalidatePath("/blog");
    redirect(withAdminSavedParam("/admin/blog/categories"));
  }

  const { error } = await supabase
    .from("blog_categories")
    .update({ name, slug, sort_order, is_active })
    .eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog");
  redirect(withAdminSavedParam("/admin/blog/categories"));
}

export async function deleteBlogCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const { count, error: countError } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    console.error(countError);
    redirect("/admin/blog/categories?error=delete-failed");
  }
  if (count && count > 0) {
    redirect("/admin/blog/categories?error=in-use");
  }

  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) {
    console.error(error);
    redirect("/admin/blog/categories?error=delete-failed");
  }

  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog");
  redirect("/admin/blog/categories");
}
