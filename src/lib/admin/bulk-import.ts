import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUniqueSlug, normalizeSlug } from "@/lib/slug";
import { nettoEnteredToGross } from "@/lib/vat";
import type { VkInputMode } from "@/types/database";
import { COSTS_MIGRATION_HINT, upsertCostRow } from "@/lib/admin/costs";

// Gemeinsame Logik für den Excel-Bulk-Import von Inseraten und Zubehör.
// Route Handler kümmern sich um das Parsen der .xlsx (exceljs) und übergeben
// hier reine Rohzeilen ({ rowNumber, values: {columnKey → Zellwert} }); alle
// Validierung, Typkonvertierung, Kategorie-Auflösung und DB-Writes liegen hier.
// Konvertierungen und Preis-/Slug-Logik werden aus dem Einzel-Formular
// (listings/accessories actions.ts, slug.ts, vat.ts, costs.ts) wiederverwendet.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

// ---------------------------------------------------------------------------
// Parsing-Helfer (gespiegelt aus listings/actions.ts, damit Bulk und Formular
// identisch konvertieren).
// ---------------------------------------------------------------------------

export function parseIntOrNull(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number.parseInt(v.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseFloatOrNull(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number.parseFloat(v.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseEuroToCents(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number.parseFloat(v.trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function parseVkInputMode(v: string | undefined): VkInputMode {
  return v?.trim().toLowerCase() === "netto" ? "netto" : "brutto";
}

export function parseYesNo(v: string | undefined): boolean | null {
  const t = v?.trim().toLowerCase();
  if (t === "ja" || t === "yes" || t === "true") return true;
  if (t === "nein" || t === "no" || t === "false") return false;
  return null;
}

// ---------------------------------------------------------------------------
// Spalten-Definitionen (Quelle für Vorlagen-Erzeugung UND Header-Zuordnung).
// ---------------------------------------------------------------------------

export type ColumnType =
  | "text"
  | "euro"
  | "int"
  | "float"
  | "category"
  | "offerType"
  | "vkMode"
  | "yesno";

export type ColumnDef = {
  /** interner Schlüssel, unter dem der Wert in `values` landet */
  key: string;
  /** Spaltenüberschrift in der Excel-Datei */
  header: string;
  type: ColumnType;
  required?: boolean;
  /** Beispielwert für die Vorlagen-Beispielzeile */
  example?: string;
  /** Spaltenbreite in der Vorlage */
  width?: number;
  /** erlaubte Werte → Dropdown-Validierung in der Vorlage */
  enumValues?: string[];
  /**
   * true = das Dropdown bietet die enumValues nur als Vorschlag; abweichender
   * Freitext bleibt erlaubt (keine Warnung). Für Felder, die in der DB frei
   * gespeichert werden (z. B. Zustand), aber üblicherweise aus wenigen Werten
   * bestehen.
   */
  allowFreeText?: boolean;
};

const OFFER_TYPES = ["Kauf", "Miete", "Kauf und Miete"];
const VK_MODES = ["brutto", "netto"];
const YES_NO = ["ja", "nein"];

export const LISTING_COLUMNS: ColumnDef[] = [
  { key: "title", header: "Titel", type: "text", required: true, width: 30, example: "Anhänger PKW 750 kg" },
  { key: "category", header: "Kategorie", type: "category", required: true, width: 22, example: "PKW-Anhänger" },
  { key: "offer_type", header: "Angebotsart", type: "offerType", required: true, width: 16, enumValues: OFFER_TYPES, example: "Kauf" },
  { key: "price_eur", header: "Kaufpreis (€)", type: "euro", width: 14, example: "1290" },
  { key: "daily_eur", header: "Mietpreis (€/Tag)", type: "euro", width: 16, example: "" },
  { key: "vk_input_mode", header: "Preis-Eingabemodus", type: "vkMode", width: 18, enumValues: VK_MODES, example: "brutto" },
  { key: "purchase_net_eur", header: "Einkaufspreis netto (€)", type: "euro", width: 20, example: "" },
  { key: "brand", header: "Marke", type: "text", width: 18, example: "Musterhersteller" },
  { key: "article_number", header: "Artikelnummer", type: "text", width: 16, example: "ART-001" },
  { key: "condition", header: "Zustand", type: "text", width: 16, example: "Neu", enumValues: ["Neu", "Neuwertig", "Gebraucht", "Vorführmodell"], allowFreeText: true },
  { key: "description", header: "Beschreibung", type: "text", width: 40, example: "" },
  { key: "payload_kg", header: "Nutzlast (kg)", type: "int", width: 14, example: "615" },
  { key: "exterior_length_mm", header: "Außenlänge (mm)", type: "int", width: 16, example: "3300" },
  { key: "exterior_width_mm", header: "Außenbreite (mm)", type: "int", width: 16, example: "1500" },
  { key: "loading_length_mm", header: "Ladefläche Länge (mm)", type: "int", width: 20, example: "2510" },
  { key: "loading_width_mm", header: "Ladefläche Breite (mm)", type: "int", width: 20, example: "1310" },
  { key: "gross_weight_kg", header: "zul. Gesamtgewicht (kg)", type: "int", width: 20, example: "750" },
  { key: "empty_weight_kg", header: "Leergewicht (kg)", type: "int", width: 16, example: "135" },
  { key: "tire_size_inch", header: "Reifengröße (Zoll)", type: "float", width: 16, example: "13" },
  { key: "axle_count", header: "Achsen", type: "int", width: 10, example: "1" },
  { key: "braked", header: "gebremst", type: "yesno", width: 12, enumValues: YES_NO, example: "nein" },
  { key: "tip_function", header: "Kippfunktion", type: "text", width: 16, example: "" },
  { key: "lighting", header: "Beleuchtung", type: "text", width: 16, example: "" },
  { key: "loading_ramps", header: "Laderampen", type: "text", width: 16, example: "" },
  { key: "loading_area", header: "Ladefläche", type: "text", width: 16, example: "" },
];

export const ACCESSORY_COLUMNS: ColumnDef[] = [
  { key: "name", header: "Name", type: "text", required: true, width: 30, example: "Stützrad" },
  { key: "category", header: "Kategorie", type: "category", width: 22, example: "" },
  { key: "brand", header: "Marke", type: "text", width: 18, example: "Musterhersteller" },
  { key: "article_number", header: "Artikelnummer", type: "text", width: 16, example: "ZUB-001" },
  { key: "description", header: "Beschreibung", type: "text", width: 40, example: "" },
  { key: "price_adjustment_eur", header: "Preisaufschlag (€)", type: "euro", width: 16, example: "49" },
  { key: "vk_input_mode", header: "Preis-Eingabemodus", type: "vkMode", width: 18, enumValues: VK_MODES, example: "brutto" },
  { key: "purchase_net_eur", header: "Einkaufspreis netto (€)", type: "euro", width: 20, example: "" },
];

// ---------------------------------------------------------------------------
// Header-Zuordnung + Report
// ---------------------------------------------------------------------------

export type RawRow = { rowNumber: number; values: Record<string, string> };

export type ImportReport = {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  warnings: string[];
};

function normalizeHeader(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Ordnet die Header-Zeile der Excel-Datei den Spalten-Keys zu (case-insensitiv,
 * Whitespace-tolerant). Gibt eine Map columnKey → 1-basierter Spaltenindex
 * zurück plus die Liste fehlender Pflichtspalten.
 */
export function matchHeaderColumns(
  headerCells: string[],
  columns: ColumnDef[],
): { indexByKey: Map<string, number>; missingRequired: ColumnDef[] } {
  const byHeader = new Map<string, number>();
  headerCells.forEach((cell, i) => {
    if (cell) byHeader.set(normalizeHeader(cell), i + 1);
  });
  const indexByKey = new Map<string, number>();
  const missingRequired: ColumnDef[] = [];
  for (const col of columns) {
    const idx = byHeader.get(normalizeHeader(col.header));
    if (idx != null) indexByKey.set(col.key, idx);
    else if (col.required) missingRequired.push(col);
  }
  return { indexByKey, missingRequired };
}

async function buildCategoryMap(db: Db, table: string): Promise<Map<string, string>> {
  const { data } = await db.from(table).select("id, name");
  const map = new Map<string, string>();
  for (const c of (data ?? []) as { id: string; name: string }[]) {
    map.set(c.name.trim().toLowerCase(), c.id);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Import: Inserate (Entwurf, published=false)
// ---------------------------------------------------------------------------

export async function importListings(db: Db, rows: RawRow[]): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [], warnings: [] };
  const categoryMap = await buildCategoryMap(db, "categories");
  let costWarned = false;

  const noteCost = (r: { ok: boolean; missingTable?: boolean }) => {
    if (r.ok || costWarned) return;
    report.warnings.push(
      r.missingTable
        ? COSTS_MIGRATION_HINT
        : "Einige Einkaufspreise konnten nicht gespeichert werden.",
    );
    costWarned = true;
  };

  for (const { rowNumber, values } of rows) {
    const fail = (reason: string) => {
      report.errors.push({ row: rowNumber, reason });
      report.skipped++;
    };
    try {
      const title = (values.title ?? "").trim();
      if (!title) {
        fail("Titel fehlt.");
        continue;
      }
      const categoryName = (values.category ?? "").trim();
      if (!categoryName) {
        fail("Kategorie fehlt.");
        continue;
      }
      const category_id = categoryMap.get(categoryName.toLowerCase());
      if (!category_id) {
        fail(`Unbekannte Kategorie: „${categoryName}".`);
        continue;
      }

      const offer = (values.offer_type ?? "").trim().toLowerCase();
      let listing_type: "kauf" | "miete" | "kauf_und_miete";
      if (offer === "kauf") listing_type = "kauf";
      else if (offer === "miete") listing_type = "miete";
      else if (offer === "kauf und miete" || offer === "kauf_und_miete")
        listing_type = "kauf_und_miete";
      else {
        fail(`Ungültige Angebotsart: „${values.offer_type ?? ""}" (Kauf / Miete / Kauf und Miete).`);
        continue;
      }
      const hasKauf = listing_type === "kauf" || listing_type === "kauf_und_miete";
      const hasMiete = listing_type === "miete" || listing_type === "kauf_und_miete";

      const vk_input_mode = parseVkInputMode(values.vk_input_mode);
      const enteredPrice = hasKauf ? parseEuroToCents(values.price_eur) : null;
      const enteredDaily = hasMiete ? parseEuroToCents(values.daily_eur) : null;
      if (hasKauf && enteredPrice == null) {
        fail("Kaufpreis fehlt (Angebotsart enthält Kauf).");
        continue;
      }
      if (hasMiete && enteredDaily == null) {
        fail("Mietpreis fehlt (Angebotsart enthält Miete).");
        continue;
      }
      const purchase = parseEuroToCents(values.purchase_net_eur);
      if (purchase != null && purchase < 0) {
        fail("Einkaufspreis darf nicht negativ sein.");
        continue;
      }

      // Update-Erkennung über Artikelnummer.
      const article_number = (values.article_number ?? "").trim() || null;
      let existingId: string | null = null;
      let existing: { price_cents: number | null; daily_rate_cents: number | null } | null = null;
      if (article_number) {
        const { data: matches } = await db
          .from("listings")
          .select("id, price_cents, daily_rate_cents")
          .eq("article_number", article_number);
        const list = (matches ?? []) as {
          id: string;
          price_cents: number | null;
          daily_rate_cents: number | null;
        }[];
        if (list.length > 1) {
          fail(`Artikelnummer „${article_number}" ist mehrfach vorhanden — bitte manuell zuordnen.`);
          continue;
        }
        if (list.length === 1) {
          existingId = list[0].id;
          existing = { price_cents: list[0].price_cents, daily_rate_cents: list[0].daily_rate_cents };
        }
      }

      const price_cents =
        enteredPrice != null && vk_input_mode === "netto"
          ? nettoEnteredToGross(enteredPrice, existing?.price_cents)
          : enteredPrice;
      const daily_rate_cents =
        enteredDaily != null && vk_input_mode === "netto"
          ? nettoEnteredToGross(enteredDaily, existing?.daily_rate_cents)
          : enteredDaily;

      const row = {
        title,
        article_number,
        brand: (values.brand ?? "").trim() || null,
        description: (values.description ?? "").trim() || null,
        price_cents,
        daily_rate_cents,
        condition: (values.condition ?? "").trim() || null,
        exterior_length_mm: parseIntOrNull(values.exterior_length_mm),
        exterior_width_mm: parseIntOrNull(values.exterior_width_mm),
        loading_length_mm: parseIntOrNull(values.loading_length_mm),
        loading_width_mm: parseIntOrNull(values.loading_width_mm),
        gross_weight_kg: parseIntOrNull(values.gross_weight_kg),
        payload_kg: parseIntOrNull(values.payload_kg),
        empty_weight_kg: parseIntOrNull(values.empty_weight_kg),
        tire_size_inch: parseFloatOrNull(values.tire_size_inch),
        axle_count: parseIntOrNull(values.axle_count),
        braked: parseYesNo(values.braked),
        tip_function: (values.tip_function ?? "").trim() || null,
        lighting: (values.lighting ?? "").trim() || null,
        loading_ramps: (values.loading_ramps ?? "").trim() || null,
        loading_area: (values.loading_area ?? "").trim() || null,
        category_id,
        listing_type,
        published: false, // Bulk-Import immer als Entwurf.
        updated_at: new Date().toISOString(),
      };

      let listingId: string;
      if (existingId) {
        // Slug beim Update unangetastet lassen.
        const { error } = await db.from("listings").update(row).eq("id", existingId);
        if (error) throw error;
        listingId = existingId;
        report.updated++;
      } else {
        const slug = await ensureUniqueSlug(normalizeSlug(title), async (candidate) => {
          const { data } = await db
            .from("listings")
            .select("id")
            .eq("slug", candidate)
            .maybeSingle();
          return Boolean(data);
        });
        if (!slug) {
          fail("Slug konnte nicht aus dem Titel erzeugt werden.");
          continue;
        }
        const { data: inserted, error } = await db
          .from("listings")
          .insert({ ...row, slug, gallery_paths: [] })
          .select("id")
          .single();
        if (error || !inserted) throw error ?? new Error("Insert lieferte keine ID.");
        listingId = inserted.id as string;
        report.created++;
      }

      noteCost(
        await upsertCostRow(db, "listing", listingId, {
          purchase_price_net_cents: purchase,
          vk_input_mode,
        }),
      );
    } catch (e) {
      console.error("Bulk-Import Inserat, Zeile", rowNumber, e);
      fail("Unerwarteter Fehler beim Speichern.");
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Import: Zubehör (inaktiv, active=false)
// ---------------------------------------------------------------------------

export async function importAccessories(db: Db, rows: RawRow[]): Promise<ImportReport> {
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [], warnings: [] };
  const categoryMap = await buildCategoryMap(db, "accessory_categories");
  let costWarned = false;

  const noteCost = (r: { ok: boolean; missingTable?: boolean }) => {
    if (r.ok || costWarned) return;
    report.warnings.push(
      r.missingTable
        ? COSTS_MIGRATION_HINT
        : "Einige Einkaufspreise konnten nicht gespeichert werden.",
    );
    costWarned = true;
  };

  for (const { rowNumber, values } of rows) {
    const fail = (reason: string) => {
      report.errors.push({ row: rowNumber, reason });
      report.skipped++;
    };
    try {
      const name = (values.name ?? "").trim();
      if (!name) {
        fail("Name fehlt.");
        continue;
      }

      const categoryName = (values.category ?? "").trim();
      let category_id: string | null = null;
      if (categoryName) {
        category_id = categoryMap.get(categoryName.toLowerCase()) ?? null;
        if (!category_id) {
          fail(`Unbekannte Kategorie: „${categoryName}".`);
          continue;
        }
      }

      const purchase = parseEuroToCents(values.purchase_net_eur);
      if (purchase != null && purchase < 0) {
        fail("Einkaufspreis darf nicht negativ sein.");
        continue;
      }

      const vk_input_mode = parseVkInputMode(values.vk_input_mode);
      const entered = parseEuroToCents(values.price_adjustment_eur) ?? 0;

      const article_number = (values.article_number ?? "").trim() || null;
      let existingId: string | null = null;
      let existingAdjustment: number | null = null;
      if (article_number) {
        const { data: matches } = await db
          .from("accessories")
          .select("id, price_adjustment_cents")
          .eq("article_number", article_number);
        const list = (matches ?? []) as { id: string; price_adjustment_cents: number }[];
        if (list.length > 1) {
          fail(`Artikelnummer „${article_number}" ist mehrfach vorhanden — bitte manuell zuordnen.`);
          continue;
        }
        if (list.length === 1) {
          existingId = list[0].id;
          existingAdjustment = list[0].price_adjustment_cents;
        }
      }

      const price_adjustment_cents =
        vk_input_mode === "netto" ? nettoEnteredToGross(entered, existingAdjustment) : entered;

      const base = {
        name,
        article_number,
        brand: (values.brand ?? "").trim() || null,
        description: (values.description ?? "").trim() || null,
        category_id,
        price_adjustment_cents,
      };

      let accessoryId: string;
      if (existingId) {
        const { error } = await db
          .from("accessories")
          .update({ ...base, updated_at: new Date().toISOString() })
          .eq("id", existingId);
        if (error) throw error;
        accessoryId = existingId;
        report.updated++;
      } else {
        accessoryId = crypto.randomUUID();
        const { error } = await db
          .from("accessories")
          .insert({ id: accessoryId, ...base, active: false }); // Bulk-Import inaktiv.
        if (error) throw error;
        report.created++;
      }

      noteCost(
        await upsertCostRow(db, "accessory", accessoryId, {
          purchase_price_net_cents: purchase,
          vk_input_mode,
        }),
      );
    } catch (e) {
      console.error("Bulk-Import Zubehör, Zeile", rowNumber, e);
      fail("Unerwarteter Fehler beim Speichern.");
    }
  }

  return report;
}
