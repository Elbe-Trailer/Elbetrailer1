import { formatEurFromCents, formatPercentDe } from "@/lib/format";
import { grossToNetCents, marginCents, marginPercent } from "@/lib/vat";

// Admin-interne Gegenüberstellung VK/EK mit Marge. Nur unter /admin verwenden —
// EK-Daten dürfen nie in Käufer-Komponenten gelangen.

export type MarginLine = {
  key: string;
  label: string;
  sublabel?: string;
  quantity: number;
  /** VK je Einheit, brutto (Cent). */
  vkGrossCents: number;
  /** EK je Einheit, netto (Cent); null = kein EK hinterlegt. */
  ekNetCents: number | null;
};

type Props = {
  lines: MarginLine[];
  /** miete: Spalten "/ Tag", keine Margen-Spalten (EK = Anschaffungskosten). */
  mode: "kauf" | "miete";
};

export default function MarginTable({ lines, mode }: Props) {
  const isKauf = mode === "kauf";
  const perDay = isKauf ? "" : " / Tag";
  // Netto je Zeile runden und dann summieren, damit Zeilen und Summen in der
  // Tabelle exakt zusammenpassen.
  const complete = lines.filter((l) => l.ekNetCents != null);
  const missingCount = lines.length - complete.length;
  const totalVkGross = lines.reduce((s, l) => s + l.vkGrossCents * l.quantity, 0);
  const totalVkNet = lines.reduce(
    (s, l) => s + grossToNetCents(l.vkGrossCents) * l.quantity,
    0,
  );
  const totalEkNet = complete.reduce(
    (s, l) => s + (l.ekNetCents as number) * l.quantity,
    0,
  );
  const totalMargin = complete.reduce(
    (s, l) =>
      s + (grossToNetCents(l.vkGrossCents) - (l.ekNetCents as number)) * l.quantity,
    0,
  );
  const completeVkNet = complete.reduce(
    (s, l) => s + grossToNetCents(l.vkGrossCents) * l.quantity,
    0,
  );
  const totalMarginPct =
    completeVkNet > 0 ? (totalMargin / completeVkNet) * 100 : null;

  const numCell = "px-3 py-2 text-right tabular-nums";

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2 font-medium">Position</th>
              <th className="px-3 py-2 text-right font-medium">Menge</th>
              <th className="px-3 py-2 text-right font-medium">
                VK brutto{perDay}
              </th>
              <th className="px-3 py-2 text-right font-medium">
                VK netto{perDay}
              </th>
              <th className="px-3 py-2 text-right font-medium">EK netto</th>
              {isKauf ? (
                <>
                  <th className="px-3 py-2 text-right font-medium">Marge €</th>
                  <th className="px-3 py-2 text-right font-medium">Marge %</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const lineVkNet = grossToNetCents(l.vkGrossCents) * l.quantity;
              const perUnitMargin = marginCents(l.vkGrossCents, l.ekNetCents);
              const lineMargin =
                perUnitMargin == null ? null : perUnitMargin * l.quantity;
              // Die Menge kürzt sich in der Prozent-Marge heraus.
              const lineMarginPct = marginPercent(l.vkGrossCents, l.ekNetCents);
              return (
                <tr
                  key={l.key}
                  className="border-t border-zinc-200 dark:border-zinc-700"
                >
                  <td className="px-3 py-2">
                    {l.label}
                    {l.sublabel ? (
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {l.sublabel}
                      </span>
                    ) : null}
                  </td>
                  <td className={numCell}>{l.quantity}</td>
                  <td className={numCell}>
                    {formatEurFromCents(l.vkGrossCents * l.quantity)}
                  </td>
                  <td className={numCell}>{formatEurFromCents(lineVkNet)}</td>
                  <td className={numCell}>
                    {l.ekNetCents == null ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
                        EK fehlt
                      </span>
                    ) : (
                      formatEurFromCents(l.ekNetCents * l.quantity)
                    )}
                  </td>
                  {isKauf ? (
                    <>
                      <td className={numCell}>
                        {lineMargin == null ? "—" : formatEurFromCents(lineMargin)}
                      </td>
                      <td className={numCell}>
                        {lineMarginPct == null ? "—" : formatPercentDe(lineMarginPct)}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-300 font-semibold dark:border-zinc-600">
              <td className="px-3 py-2">Gesamt</td>
              <td className={numCell} />
              <td className={numCell}>{formatEurFromCents(totalVkGross)}</td>
              <td className={numCell}>{formatEurFromCents(totalVkNet)}</td>
              <td className={numCell}>
                {complete.length ? formatEurFromCents(totalEkNet) : "—"}
              </td>
              {isKauf ? (
                <>
                  <td className={numCell}>
                    {complete.length ? formatEurFromCents(totalMargin) : "—"}
                  </td>
                  <td className={numCell}>
                    {totalMarginPct == null ? "—" : formatPercentDe(totalMarginPct)}
                  </td>
                </>
              ) : null}
            </tr>
          </tfoot>
        </table>
      </div>
      {missingCount > 0 ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {isKauf ? "Marge unvollständig — " : ""}EK fehlt bei {missingCount}{" "}
          Position(en).
        </p>
      ) : null}
    </div>
  );
}
