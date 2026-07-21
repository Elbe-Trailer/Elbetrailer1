import type { VkInputMode } from "@/types/database";

// Alle gespeicherten Verkaufspreise (price_cents, daily_rate_cents,
// price_adjustment_cents) sind Brutto; Einkaufspreise (purchase_price_net_cents)
// sind Netto. Rundungsregel: Der eingegebene Wert ist maßgeblich, der Gegenwert
// ist reine Anzeige. Netto→Brutto→Netto kann ±1 Cent driften — akzeptiert.
// Konversionen nie auf bereits gespeicherten Werten verketten.

export const VAT_RATE = 0.19;

export type { VkInputMode };

/** Netto-Cents → Brutto-Cents (kaufmännisch auf ganze Cents gerundet). */
export function netToGrossCents(netCents: number): number {
  return Math.round(netCents * (1 + VAT_RATE));
}

/** Brutto-Cents → Netto-Cents. */
export function grossToNetCents(grossCents: number): number {
  return Math.round(grossCents / (1 + VAT_RATE));
}

/**
 * Zerlegt einen Brutto-Betrag in Netto + MwSt. Die MwSt ist die Differenz,
 * damit Netto + MwSt = Brutto immer exakt aufgeht.
 */
export function vatBreakdownFromGross(grossCents: number): {
  grossCents: number;
  netCents: number;
  vatCents: number;
} {
  const netCents = grossToNetCents(grossCents);
  return { grossCents, netCents, vatCents: grossCents - netCents };
}

/**
 * Konvertiert eine Netto-Eingabe in den zu speichernden Brutto-Wert.
 * Die Netto-Anzeige ist gerundet: Entspricht die Eingabe exakt dem Netto des
 * bereits gespeicherten Brutto-Werts, bleibt der gespeicherte Wert erhalten —
 * sonst würde jedes Speichern ohne Preisänderung den Preis um ±1 Cent
 * verschieben (Konversions-Verkettung, siehe Rundungsregel oben).
 */
export function nettoEnteredToGross(
  enteredNet: number,
  storedGross: number | null | undefined,
): number {
  if (storedGross != null && grossToNetCents(storedGross) === enteredNet) {
    return storedGross;
  }
  return netToGrossCents(enteredNet);
}

/** Marge in Cents: VK netto − EK netto. null, wenn eine Seite fehlt. */
export function marginCents(
  vkGrossCents: number | null | undefined,
  ekNetCents: number | null | undefined,
): number | null {
  if (vkGrossCents == null || ekNetCents == null) return null;
  return grossToNetCents(vkGrossCents) - ekNetCents;
}

/**
 * Marge in % vom Netto-VK (Handelsspanne): (VKnetto − EKnetto) / VKnetto × 100.
 * null, wenn EK fehlt oder VKnetto <= 0. Rundung ist Sache der Anzeige.
 */
export function marginPercent(
  vkGrossCents: number | null | undefined,
  ekNetCents: number | null | undefined,
): number | null {
  if (vkGrossCents == null || ekNetCents == null) return null;
  const vkNet = grossToNetCents(vkGrossCents);
  if (vkNet <= 0) return null;
  return ((vkNet - ekNetCents) / vkNet) * 100;
}
