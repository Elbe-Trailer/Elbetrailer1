"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SaveBannerState = undefined | { ok: false; error: string };

export async function saveBanner(
  _prev: SaveBannerState,
  formData: FormData,
): Promise<SaveBannerState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim() || null;
  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const link_url = String(formData.get("link_url") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  const file = formData.get("image") as File | null;
  const hasFile = file && typeof file !== "string" && file.size > 0;

  if (!id && !hasFile) {
    return { ok: false, error: "Bild ist erforderlich." };
  }

  let image_path = "";
  if (hasFile) {
    const safe = file!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("banners")
      .upload(path, file!, { upsert: false });
    if (upErr) {
      console.error(upErr);
      return { ok: false, error: "Upload fehlgeschlagen." };
    }
    image_path = path;
  }

  if (!id) {
    const { error } = await supabase.from("banner_slides").insert({
      image_path,
      sort_order,
      link_url,
      active,
    });
    if (error) {
      console.error(error);
      return { ok: false, error: "Speichern fehlgeschlagen." };
    }
    revalidatePath("/");
    revalidatePath("/admin/banners");
    redirect(withAdminSavedParam("/admin/banners"));
  }

  const { data: existing } = await supabase
    .from("banner_slides")
    .select("image_path")
    .eq("id", id)
    .single();

  const finalImage = image_path || existing?.image_path || "";
  if (!finalImage) {
    return { ok: false, error: "Kein Bild vorhanden." };
  }

  const { error } = await supabase
    .from("banner_slides")
    .update({
      image_path: finalImage,
      sort_order,
      link_url,
      active,
    })
    .eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/");
  revalidatePath("/admin/banners");
  redirect(withAdminSavedParam("/admin/banners"));
}

export async function deleteBanner(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("banner_slides")
    .select("image_path")
    .eq("id", id)
    .single();
  if (row?.image_path) {
    await supabase.storage.from("banners").remove([row.image_path]);
  }
  await supabase.from("banner_slides").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}
