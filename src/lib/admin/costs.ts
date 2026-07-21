import type { SupabaseClient } from "@supabase/supabase-js";
import type { VkInputMode } from "@/types/database";

// Gemeinsamer Schreibpfad für die admin-only Cost-Tabellen. 42P01 (Tabelle
// fehlt, Migration 20260721000029 nicht angewendet) wird gesondert gemeldet,
// damit Aufrufer das Speichern der Hauptzeile nicht daran scheitern lassen.

export const COSTS_MIGRATION_HINT =
  "Einkaufspreis nicht gespeichert — bitte die Migration 20260721000029_purchase_prices.sql im Supabase SQL Editor anwenden.";

export type CostKind = "listing" | "accessory";

export type UpsertCostResult =
  | { ok: true }
  | { ok: false; missingTable: boolean };

export async function upsertCostRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  kind: CostKind,
  id: string,
  payload: {
    purchase_price_net_cents: number | null;
    vk_input_mode?: VkInputMode;
  },
): Promise<UpsertCostResult> {
  const table = kind === "listing" ? "listing_costs" : "accessory_costs";
  const idColumn = kind === "listing" ? "listing_id" : "accessory_id";
  const { error } = await supabase.from(table).upsert(
    {
      [idColumn]: id,
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: idColumn },
  );
  if (!error) return { ok: true };
  if (error.code === "42P01") {
    console.warn(`${table} fehlt — Migration 20260721000029 anwenden.`);
    return { ok: false, missingTable: true };
  }
  console.error(error);
  return { ok: false, missingTable: false };
}
