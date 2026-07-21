import { grossToNetCents, netToGrossCents } from "@/lib/vat";
import type { VkInputMode } from "@/types/database";

// String-Helfer für die Preisfelder der Admin-Formulare (input type="number"
// erwartet Punkt als Dezimaltrenner; Nutzereingaben mit Komma werden toleriert).

export function eurStringToCents(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function centsToEurString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Rechnet den Feldinhalt beim Umschalten Brutto↔Netto einmalig um.
 * Leere/ungültige Eingaben bleiben unverändert.
 */
export function convertEurString(
  v: string,
  from: VkInputMode,
  to: VkInputMode,
): string {
  if (from === to) return v;
  const cents = eurStringToCents(v);
  if (cents == null) return v;
  return centsToEurString(
    to === "netto" ? grossToNetCents(cents) : netToGrossCents(cents),
  );
}
