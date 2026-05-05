"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseEuroToCents(v: FormDataEntryValue | null): number {
  if (v == null || v === "") return 0;
  const n = Number.parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export type SaveAccessoryState =
  | undefined
  | { ok: false; error: string }
  | { ok: true; accessoryId: string; created: boolean };

async function uploadAccImage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  folderId: string,
  file: File,
): Promise<string | null> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folderId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from("accessories")
    .upload(path, file, { upsert: false });
  return error ? null : path;
}

export async function saveAccessory(
  _prev: SaveAccessoryState,
  formData: FormData,
): Promise<SaveAccessoryState> {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name erforderlich." };

  const description =
    String(formData.get("description") ?? "").trim() || null;
  const article_number =
    String(formData.get("article_number") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const price_adjustment_cents = parseEuroToCents(
    formData.get("price_adjustment_eur"),
  );
  const active = formData.get("active") === "on";
  const file = formData.get("image") as File | null;
  const hasFile = file && typeof file !== "string" && file.size > 0;

  if (!id) {
    const newId = crypto.randomUUID();
    let image_path: string | null = null;
    if (hasFile) {
      image_path = await uploadAccImage(supabase, newId, file);
    }
    const { error } = await supabase.from("accessories").insert({
      id: newId,
      name,
      article_number,
      brand,
      description,
      category_id,
      price_adjustment_cents,
      active,
      image_path,
    });
    if (error) {
      console.error(error);
      return { ok: false, error: "Anlegen fehlgeschlagen." };
    }
    revalidatePath("/admin/accessories");
    return { ok: true, accessoryId: newId, created: true };
  }

  const { data: existing } = await supabase
    .from("accessories")
    .select("image_path")
    .eq("id", id)
    .single();
  let image_path = existing?.image_path ?? null;
  if (hasFile) {
    const p = await uploadAccImage(supabase, id, file!);
    if (p) image_path = p;
  }

  const { error } = await supabase
    .from("accessories")
    .update({
      name,
      article_number,
      brand,
      description,
      category_id,
      price_adjustment_cents,
      active,
      image_path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/accessories");
  redirect(withAdminSavedParam(`/admin/accessories/${id}`));
}

export async function deleteAccessory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("accessories")
    .select("image_path")
    .eq("id", id)
    .single();
  if (row?.image_path) {
    await supabase.storage.from("accessories").remove([row.image_path]);
  }
  await supabase.from("accessories").delete().eq("id", id);
  revalidatePath("/admin/accessories");
  redirect("/admin/accessories");
}
