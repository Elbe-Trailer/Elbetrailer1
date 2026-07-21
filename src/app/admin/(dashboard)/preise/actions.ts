"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { listingPublicPath } from "@/lib/listing-url";
import { revalidateSiteHome } from "@/lib/cache/revalidate-site";
import { COSTS_MIGRATION_HINT } from "@/lib/admin/costs";
import {
  buildAdjustment,
  computeAdjustedCents,
  type PriceAdjustment,
  type VkRounding,
} from "@/lib/priceIncrease";
import { revalidatePath } from "next/cache";

export type PriceTarget = { kind: "listing" | "accessory"; id: string };

export type ApplyPriceIncreaseState =
  | undefined
  | { ok: false; error: string }
  | {
      ok: true;
      updatedVk: number;
      updatedEk: number;
      skippedMissingVk: number;
      skippedMissingEk: number;
      failedVk: number;
      failedEk: number;
      warning?: string;
    };

const MAX_TARGETS = 1000;

// Kein Transaktions-Support über PostgREST: Die Updates laufen einzeln und
// werden bei Fehlern NICHT abgebrochen, sondern gezählt — ein Abbruch mitten
// im Lauf würde bei erneutem Anwenden die bereits erhöhten Zeilen doppelt
// erhöhen. Fehlgeschlagene Zeilen meldet das Ergebnis explizit.
export async function applyPriceIncrease(
  _prev: ApplyPriceIncreaseState,
  formData: FormData,
): Promise<ApplyPriceIncreaseState> {
  const { supabase } = await requireAdmin();

  let targets: PriceTarget[];
  try {
    const parsed = JSON.parse(String(formData.get("targets") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("not an array");
    targets = parsed.filter(
      (t): t is PriceTarget =>
        t != null &&
        (t.kind === "listing" || t.kind === "accessory") &&
        typeof t.id === "string" &&
        t.id.length > 0,
    );
  } catch {
    return { ok: false, error: "Ungültige Auswahl." };
  }
  if (targets.length === 0) {
    return { ok: false, error: "Keine Einträge ausgewählt." };
  }
  if (targets.length > MAX_TARGETS) {
    return {
      ok: false,
      error: `Zu viele Einträge ausgewählt (${targets.length}) — maximal ${MAX_TARGETS} pro Durchlauf.`,
    };
  }

  const ekAdj = buildAdjustment(
    String(formData.get("ek_mode") ?? "none"),
    String(formData.get("ek_value") ?? ""),
  );
  if (ekAdj == null) {
    return { ok: false, error: "EK: Bitte einen gültigen Wert angeben." };
  }
  const vkAdj = buildAdjustment(
    String(formData.get("vk_mode") ?? "none"),
    String(formData.get("vk_value") ?? ""),
  );
  if (vkAdj == null) {
    return { ok: false, error: "VK: Bitte einen gültigen Wert angeben." };
  }
  // VK erlaubt nur percent/set; EK erlaubt absolute/percent/set.
  if (vkAdj.mode === "absolute") {
    return { ok: false, error: "VK: Ungültige Anpassungsart." };
  }
  const ekAdjustment: PriceAdjustment = ekAdj;
  const vkAdjustment: PriceAdjustment = vkAdj;
  if (ekAdjustment.mode === "none" && vkAdjustment.mode === "none") {
    return { ok: false, error: "Keine Anpassung gewählt." };
  }
  // Euro-Rundung nur bei prozentualer Anpassung — ein exakt eingegebener
  // neuer Wert ("set") darf nicht stillschweigend gerundet werden.
  const vkRounding: VkRounding =
    vkAdjustment.mode === "percent" && formData.get("vk_rounding") === "euro"
      ? "euro"
      : "cent";

  const listingIds = targets.filter((t) => t.kind === "listing").map((t) => t.id);
  const accessoryIds = targets
    .filter((t) => t.kind === "accessory")
    .map((t) => t.id);

  let updatedVk = 0;
  let updatedEk = 0;
  let skippedMissingVk = 0;
  let skippedMissingEk = 0;
  let failedVk = 0;
  let failedEk = 0;
  let ekTableMissing = false;
  const now = new Date().toISOString();
  const changedListingSlugs: string[] = [];
  let accessoryVkChanged = false;

  // Neue EK-Werte berechnen: "set" legt Zeilen an, absolute/percent nur wo
  // bereits ein EK existiert (gezählt als übersprungen).
  function computeEkRows(
    ids: string[],
    ekByEntity: Map<string, number | null>,
  ): { id: string; newEk: number }[] {
    if (ekAdjustment.mode === "none") return [];
    const rows: { id: string; newEk: number }[] = [];
    for (const id of ids) {
      const current = ekByEntity.get(id) ?? null;
      if (ekAdjustment.mode !== "set" && current == null) {
        skippedMissingEk += 1;
        continue;
      }
      const newEk = computeAdjustedCents(current, ekAdjustment, "cent");
      if (newEk == null) {
        skippedMissingEk += 1;
        continue;
      }
      rows.push({ id, newEk });
    }
    return rows;
  }

  // Ein Batch-Upsert pro Cost-Tabelle statt einer Query pro Zeile.
  async function upsertEkRows(
    table: "listing_costs" | "accessory_costs",
    idColumn: "listing_id" | "accessory_id",
    rows: { id: string; newEk: number }[],
  ) {
    if (rows.length === 0) return;
    const { error } = await supabase.from(table).upsert(
      rows.map((r) => ({
        [idColumn]: r.id,
        purchase_price_net_cents: r.newEk,
        updated_at: now,
      })),
      { onConflict: idColumn },
    );
    if (error) {
      console.error(error);
      failedEk += rows.length;
      if (error.code === "42P01") ekTableMissing = true;
    } else {
      updatedEk += rows.length;
    }
  }

  if (listingIds.length > 0) {
    const [{ data: listingRows, error: listingError }, { data: costRows }] =
      await Promise.all([
        supabase
          .from("listings")
          .select("id, slug, price_cents")
          .in("id", listingIds),
        supabase
          .from("listing_costs")
          .select("listing_id, purchase_price_net_cents")
          .in("listing_id", listingIds),
      ]);
    if (listingError) {
      console.error(listingError);
      return { ok: false, error: "Inserate konnten nicht geladen werden." };
    }
    const ekByListing = new Map(
      (costRows ?? []).map((c) => [
        c.listing_id as string,
        (c.purchase_price_net_cents as number | null) ?? null,
      ]),
    );

    if (vkAdjustment.mode !== "none") {
      const vkUpdates: { id: string; slug: string; newVk: number }[] = [];
      for (const row of listingRows ?? []) {
        const newVk = computeAdjustedCents(
          (row.price_cents as number | null) ?? null,
          vkAdjustment,
          vkRounding,
        );
        if (newVk == null) {
          skippedMissingVk += 1;
        } else {
          vkUpdates.push({
            id: row.id as string,
            slug: row.slug as string,
            newVk,
          });
        }
      }
      const results = await Promise.all(
        vkUpdates.map((u) =>
          supabase
            .from("listings")
            .update({ price_cents: u.newVk, updated_at: now })
            .eq("id", u.id),
        ),
      );
      results.forEach(({ error }, i) => {
        if (error) {
          console.error(error);
          failedVk += 1;
        } else {
          updatedVk += 1;
          changedListingSlugs.push(vkUpdates[i].slug);
        }
      });
    }

    await upsertEkRows(
      "listing_costs",
      "listing_id",
      computeEkRows(
        (listingRows ?? []).map((r) => r.id as string),
        ekByListing,
      ),
    );
  }

  if (accessoryIds.length > 0) {
    const [{ data: accessoryRows, error: accessoryError }, { data: costRows }] =
      await Promise.all([
        supabase
          .from("accessories")
          .select("id, price_adjustment_cents")
          .in("id", accessoryIds),
        supabase
          .from("accessory_costs")
          .select("accessory_id, purchase_price_net_cents")
          .in("accessory_id", accessoryIds),
      ]);
    if (accessoryError) {
      console.error(accessoryError);
      return { ok: false, error: "Zubehör konnte nicht geladen werden." };
    }
    const ekByAccessory = new Map(
      (costRows ?? []).map((c) => [
        c.accessory_id as string,
        (c.purchase_price_net_cents as number | null) ?? null,
      ]),
    );

    if (vkAdjustment.mode !== "none") {
      const vkUpdates: { id: string; newVk: number }[] = [];
      for (const row of accessoryRows ?? []) {
        const newVk = computeAdjustedCents(
          typeof row.price_adjustment_cents === "number"
            ? row.price_adjustment_cents
            : 0,
          vkAdjustment,
          vkRounding,
        );
        if (newVk == null) {
          skippedMissingVk += 1;
        } else {
          vkUpdates.push({ id: row.id as string, newVk });
        }
      }
      const results = await Promise.all(
        vkUpdates.map((u) =>
          supabase
            .from("accessories")
            .update({ price_adjustment_cents: u.newVk, updated_at: now })
            .eq("id", u.id),
        ),
      );
      results.forEach(({ error }) => {
        if (error) {
          console.error(error);
          failedVk += 1;
        } else {
          updatedVk += 1;
          accessoryVkChanged = true;
        }
      });
    }

    await upsertEkRows(
      "accessory_costs",
      "accessory_id",
      computeEkRows(
        (accessoryRows ?? []).map((r) => r.id as string),
        ekByAccessory,
      ),
    );
  }

  // Zubehör-Preise erscheinen in den Konfiguratoren der verknüpften Inserate.
  if (accessoryVkChanged) {
    const { data: linkRows } = await supabase
      .from("listing_accessories")
      .select("listing_id")
      .in("accessory_id", accessoryIds);
    const linkedListingIds = Array.from(
      new Set((linkRows ?? []).map((row) => row.listing_id as string)),
    );
    if (linkedListingIds.length > 0) {
      const { data: slugRows } = await supabase
        .from("listings")
        .select("slug")
        .in("id", linkedListingIds);
      for (const row of slugRows ?? []) {
        changedListingSlugs.push(row.slug as string);
      }
    }
  }

  // Öffentliche Caches nur invalidieren, wenn sich öffentliche Preise (VK)
  // geändert haben — reine EK-Änderungen sind admin-only.
  if (updatedVk > 0) {
    revalidatePath("/");
    revalidateSiteHome();
    for (const slug of Array.from(new Set(changedListingSlugs))) {
      revalidatePath(listingPublicPath(slug));
    }
  }
  revalidatePath("/admin/listings");
  revalidatePath("/admin/accessories");
  revalidatePath("/admin/preise");

  return {
    ok: true,
    updatedVk,
    updatedEk,
    skippedMissingVk,
    skippedMissingEk,
    failedVk,
    failedEk,
    warning: ekTableMissing ? COSTS_MIGRATION_HINT : undefined,
  };
}
