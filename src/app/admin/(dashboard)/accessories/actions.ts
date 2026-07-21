"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { removeObjects, uploadObject } from "@/lib/storage-provider";
import { nettoEnteredToGross } from "@/lib/vat";
import { COSTS_MIGRATION_HINT, upsertCostRow } from "@/lib/admin/costs";
import { eurStringToCents } from "@/components/admin/priceInput";
import type { VkInputMode } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseEuroToCents(v: FormDataEntryValue | null): number {
  return v == null ? 0 : (eurStringToCents(String(v)) ?? 0);
}

// Für den EK muss "leer" null ergeben, nicht 0 (kein EK ≠ EK von 0 €).
function parseEuroToCentsOrNull(v: FormDataEntryValue | null): number | null {
  return v == null ? null : eurStringToCents(String(v));
}

export type SaveAccessoryState =
  | undefined
  | { ok: false; error: string }
  | { ok: true; accessoryId: string; created: boolean; warning?: string };

async function uploadAccImage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  folderId: string,
  file: File,
): Promise<string | null> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folderId}/${Date.now()}-${safe}`;
  const up = await uploadObject({
    bucket: "accessories",
    path,
    file,
  });
  return up.ok ? path : null;
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
  const { data: existing } = id
    ? await supabase
        .from("accessories")
        .select("image_path, price_adjustment_cents")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  // Gespeichert wird immer Brutto; bei Netto-Eingabe wird hier konvertiert
  // (mit Drift-Schutz: unveränderte Netto-Anzeige behält den Brutto-Wert).
  const vk_input_mode: VkInputMode =
    formData.get("vk_input_mode") === "netto" ? "netto" : "brutto";
  const enteredAdjustment = parseEuroToCents(
    formData.get("price_adjustment_eur"),
  );
  const price_adjustment_cents =
    vk_input_mode === "netto"
      ? nettoEnteredToGross(enteredAdjustment, existing?.price_adjustment_cents)
      : enteredAdjustment;
  const purchase_price_net_cents = parseEuroToCentsOrNull(
    formData.get("purchase_net_eur"),
  );
  if (purchase_price_net_cents != null && purchase_price_net_cents < 0) {
    return { ok: false, error: "Einkaufspreis darf nicht negativ sein." };
  }
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
    // Das Zubehör ist bereits angelegt — ein EK-Fehler wird nur als Warnung
    // gemeldet, sonst verleitet der Fehlerzustand zum doppelten Anlegen.
    const costResult = await upsertCostRow(supabase, "accessory", newId, {
      purchase_price_net_cents,
      vk_input_mode,
    });
    const createWarning = costResult.ok
      ? undefined
      : costResult.missingTable
        ? COSTS_MIGRATION_HINT
        : "Zubehör angelegt, aber der Einkaufspreis konnte nicht gespeichert werden. Bitte erneut speichern.";
    revalidatePath("/admin/accessories");
    return { ok: true, accessoryId: newId, created: true, warning: createWarning };
  }

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

  // EK + Eingabemodus in der admin-only Tabelle speichern. Unbedingter Upsert,
  // damit der Modus auch ohne EK erhalten bleibt (EK null ≠ EK 0). Das Zubehör
  // ist bereits gespeichert — ein EK-Fehler wird nur als Warnung gemeldet.
  const costResult = await upsertCostRow(supabase, "accessory", id, {
    purchase_price_net_cents,
    vk_input_mode,
  });

  revalidatePath("/admin/accessories");
  if (!costResult.ok) {
    return {
      ok: true,
      accessoryId: id,
      created: false,
      warning: costResult.missingTable
        ? COSTS_MIGRATION_HINT
        : "Zubehör gespeichert, aber der Einkaufspreis konnte nicht gespeichert werden. Bitte erneut speichern.",
    };
  }
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
    await removeObjects({
      bucket: "accessories",
      paths: [row.image_path],
    });
  }
  await supabase.from("accessories").delete().eq("id", id);
  revalidatePath("/admin/accessories");
  redirect("/admin/accessories");
}
