import ExcelJS from "exceljs";
import type { ColumnDef, RawRow } from "@/lib/admin/bulk-import";
import { matchHeaderColumns } from "@/lib/admin/bulk-import";

// Server-only exceljs-Wrapper: erzeugt die Import-Vorlage und liest hochgeladene
// .xlsx-Dateien in Rohzeilen ein. exceljs ist eine Node-Bibliothek und darf nur
// in Route Handlern (nicht im Client-Bundle) verwendet werden.

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD97706" }, // amber-600, passend zum Admin-Design
};

// exceljs exponiert worksheet.dataValidations zur Laufzeit, aber nicht in den
// Typdefinitionen. Schmaler, selbsttragender Typ für den benötigten add().
type ListValidation = {
  type: "list";
  allowBlank: boolean;
  formulae: string[];
  showErrorMessage?: boolean;
  errorStyle?: "error" | "warning" | "information";
  errorTitle?: string;
  error?: string;
};
function dataValidationsOf(ws: ExcelJS.Worksheet): {
  add: (sqref: string, validation: ListValidation) => void;
} {
  return (ws as unknown as {
    dataValidations: { add: (sqref: string, validation: ListValidation) => void };
  }).dataValidations;
}

/**
 * Baut die Excel-Vorlage: eine Kopfzeile mit allen Spalten, Hinweis-Notizen je
 * Spalte (Pflicht/Beispiel), Dropdown-Validierung für Kategorie/Auswahl-Spalten.
 * Beispiele stehen als Zell-Notiz — es gibt bewusst KEINE Beispiel-Datenzeile,
 * damit beim Import nichts versehentlich übernommen wird.
 */
export async function buildTemplateWorkbook(
  columns: ColumnDef[],
  categoryNames: string[],
  sheetName: string,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Marktplatz Admin";
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 18,
  }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.height = 22;

  const MAX_DATA_ROW = 500;

  // Auswahl-Werte liegen auf einem versteckten "Listen"-Blatt; die Dropdowns
  // referenzieren diese als Bereich. Das ergibt genau EINEN gültigen sqref-
  // Bereich pro Spalte (statt überlappender Bereiche beim Setzen je Einzelzelle,
  // was Excel als beschädigt meldet) und umgeht die 255-Zeichen-Grenze der
  // Inline-Liste sowie Probleme mit Kommas/Umlauten in den Werten.
  const listSheet = wb.addWorksheet("Listen");
  listSheet.state = "veryHidden";
  let listColIndex = 0;

  columns.forEach((col, i) => {
    const colIndex = i + 1;
    const cell = headerRow.getCell(colIndex);
    const noteLines: string[] = [];
    noteLines.push(col.required ? "Pflichtfeld" : "Optional");
    if (col.type === "category") {
      noteLines.push("Muss exakt einer bestehenden Kategorie entsprechen (Dropdown).");
    } else if (col.allowFreeText && col.enumValues) {
      noteLines.push("Auswahl per Dropdown oder eigener Freitext möglich.");
    }
    if (col.example) noteLines.push(`Beispiel: ${col.example}`);
    cell.note = noteLines.join("\n");

    // Auswahl-Werte für die Validierung bestimmen.
    let listValues: string[] | null = null;
    if (col.type === "category") listValues = categoryNames;
    else if (col.enumValues) listValues = col.enumValues;

    if (listValues && listValues.length > 0) {
      listColIndex += 1;
      const letter = listSheet.getColumn(listColIndex).letter;
      listValues.forEach((v, r) => {
        listSheet.getCell(r + 1, listColIndex).value = v;
      });
      const colLetter = ws.getColumn(colIndex).letter;
      // Weiches Dropdown (allowFreeText): Vorschläge auswählbar, aber eigener
      // Freitext ohne Warnung erlaubt. Sonst: Warnung bei Werten außerhalb der
      // Liste (Import prüft diese Felder ohnehin).
      dataValidationsOf(ws).add(`${colLetter}2:${colLetter}${MAX_DATA_ROW}`, {
        type: "list",
        allowBlank: true,
        formulae: [`Listen!$${letter}$1:$${letter}$${listValues.length}`],
        showErrorMessage: !col.allowFreeText,
        errorStyle: "warning",
        errorTitle: "Wert nicht in der Liste",
        error: "Bitte einen Wert aus dem Dropdown wählen.",
      });
    }
  });

  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    // Rich text
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("").trim();
    }
    // Formel-Ergebnis
    if ("result" in value && value.result != null) return String(value.result).trim();
    // Hyperlink / { text }
    if ("text" in value && value.text != null) return String(value.text).trim();
  }
  return String(value).trim();
}

export type ParseResult =
  | { ok: true; rows: RawRow[] }
  | { ok: false; error: string };

/**
 * Liest die erste Tabelle einer hochgeladenen .xlsx in Rohzeilen. Kopfzeile =
 * Zeile 1; komplett leere Zeilen werden übersprungen. Fehlende Pflichtspalten
 * führen zu einem Gesamt-Fehler (Vorlage passt nicht).
 */
export async function parseUploadedWorkbook(
  buffer: Buffer,
  columns: ColumnDef[],
): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { ok: false, error: "Datei konnte nicht gelesen werden. Bitte eine gültige .xlsx-Datei hochladen." };
  }
  const ws = wb.worksheets[0];
  if (!ws) return { ok: false, error: "Die Datei enthält kein Tabellenblatt." };

  const headerRow = ws.getRow(1);
  const headerCells: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headerCells[colNumber - 1] = cellToString(cell.value);
  });

  const { indexByKey, missingRequired } = matchHeaderColumns(headerCells, columns);
  if (missingRequired.length > 0) {
    return {
      ok: false,
      error: `Pflichtspalte(n) fehlen: ${missingRequired.map((c) => c.header).join(", ")}. Bitte die aktuelle Vorlage verwenden.`,
    };
  }

  const rows: RawRow[] = [];
  const lastRow = ws.rowCount;
  for (let r = 2; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const values: Record<string, string> = {};
    let hasAny = false;
    for (const col of columns) {
      const colIndex = indexByKey.get(col.key);
      if (colIndex == null) continue;
      const v = cellToString(row.getCell(colIndex).value);
      values[col.key] = v;
      if (v !== "") hasAny = true;
    }
    if (!hasAny) continue; // leere Zeile überspringen
    rows.push({ rowNumber: r, values });
  }

  return { ok: true, rows };
}
