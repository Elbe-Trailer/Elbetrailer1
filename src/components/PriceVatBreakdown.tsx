import { formatEurFromCents } from "@/lib/format";
import { vatBreakdownFromGross } from "@/lib/vat";

// Weist Netto und MwSt eines Brutto-Betrags aus. Rein präsentational —
// erhält ausschließlich den öffentlichen Brutto-Verkaufspreis.
export default function PriceVatBreakdown({
  grossCents,
}: {
  grossCents: number;
}) {
  const { netCents, vatCents } = vatBreakdownFromGross(grossCents);
  return (
    <div className="mt-1 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="flex justify-between">
        <span>Netto</span>
        <span>{formatEurFromCents(netCents)}</span>
      </div>
      <div className="flex justify-between">
        <span>MwSt (19 %)</span>
        <span>{formatEurFromCents(vatCents)}</span>
      </div>
    </div>
  );
}
