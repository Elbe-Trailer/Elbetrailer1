export function formatEurFromCents(cents: number | null | undefined): string {
  if (cents == null || Number.isNaN(cents)) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatMm(mm: number | null | undefined): string {
  if (mm == null) return "—";
  return `${mm} mm`;
}

export function formatPercentDe(p: number, digits = 1): string {
  return `${p.toFixed(digits).replace(".", ",")} %`;
}
