// Pure Anpassungslogik für das Preiserhöhungs-Tool. Wird client- (Vorschau)
// UND serverseitig (Server Action) verwendet, damit Vorschau und Ergebnis
// identisch sind. Prozent-Anpassungen wirken auf dem gespeicherten Wert
// (VK: Brutto, EK: Netto) — keine MwSt-Konversion bei Erhöhungen.

export type PriceAdjustment =
  | { mode: "none" }
  | { mode: "absolute"; deltaCents: number }
  | { mode: "percent"; percent: number }
  | { mode: "set"; valueCents: number };

export type VkRounding = "cent" | "euro";

/**
 * Baut aus Formular-Modus + Eingabestring eine PriceAdjustment (Komma toleriert).
 * null = ungültige Eingabe für den gewählten Modus.
 */
export function buildAdjustment(
  mode: string,
  value: string,
): PriceAdjustment | null {
  if (mode === "none") return { mode: "none" };
  const n = Number.parseFloat(value.trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  if (mode === "percent") return { mode: "percent", percent: n };
  const cents = Math.round(n * 100);
  if (mode === "absolute") return { mode: "absolute", deltaCents: cents };
  if (mode === "set") return cents < 0 ? null : { mode: "set", valueCents: cents };
  return null;
}

/**
 * Wendet eine Anpassung auf einen Cent-Betrag an.
 * "absolute"/"percent" auf null → null (Aufrufer zählt als übersprungen);
 * "set" funktioniert auch ohne Bestandswert. Ergebnis nie negativ.
 */
export function computeAdjustedCents(
  current: number | null,
  adj: PriceAdjustment,
  rounding: VkRounding = "cent",
): number | null {
  let next: number;
  switch (adj.mode) {
    case "none":
      return current;
    case "set":
      next = adj.valueCents;
      break;
    case "absolute":
      if (current == null) return null;
      next = current + adj.deltaCents;
      break;
    case "percent":
      if (current == null) return null;
      next = Math.round(current * (1 + adj.percent / 100));
      break;
  }
  if (rounding === "euro") next = Math.round(next / 100) * 100;
  return Math.max(0, next);
}
