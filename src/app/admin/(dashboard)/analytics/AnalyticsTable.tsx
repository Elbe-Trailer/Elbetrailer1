"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { listingPublicPath } from "@/lib/listing-url";
import type {
  AnalyticsPeriod,
  ListingAnalyticsRow,
} from "@/lib/analytics/listing-stats";

type SortKey = "views" | "inquiries" | "conversionRate" | "title";

type Props = {
  rows: ListingAnalyticsRow[];
  period: AnalyticsPeriod;
};

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 Tage" },
  { value: "30d", label: "30 Tage" },
  { value: "90d", label: "90 Tage" },
  { value: "all", label: "Gesamt" },
];

const LISTING_TYPE_LABELS: Record<ListingAnalyticsRow["listing_type"], string> = {
  kauf: "Kauf",
  miete: "Miete",
  kauf_und_miete: "Kauf & Miete",
};

function formatPercent(value: number): string {
  if (value === 0) return "0 %";
  if (value < 0.1) return "< 0,1 %";
  return `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
}

export default function AnalyticsTable({ rows, period }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortAsc, setSortAsc] = useState(false);

  const maxViews = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.views), 0),
    [rows],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title, "de");
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  function handlePeriodChange(next: AnalyticsPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("zeitraum", next);
    router.push(`/admin/analytics?${params.toString()}`);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === "title");
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortAsc ? " ↑" : " ↓";
  }

  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Zeitraum
          <select
            className={selectClass}
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as AnalyticsPeriod)}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-zinc-500">
          {sorted.length} Inserat{sorted.length === 1 ? "" : "e"}
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Noch keine Daten für den gewählten Zeitraum.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="hover:text-zinc-900 dark:hover:text-white"
                  >
                    Inserat{sortIndicator("title")}
                  </button>
                </th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("views")}
                    className="hover:text-zinc-900 dark:hover:text-white"
                  >
                    Aufrufe{sortIndicator("views")}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("inquiries")}
                    className="hover:text-zinc-900 dark:hover:text-white"
                  >
                    Anfragen{sortIndicator("inquiries")}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("conversionRate")}
                    className="hover:text-zinc-900 dark:hover:text-white"
                  >
                    Conversion{sortIndicator("conversionRate")}
                  </button>
                </th>
                <th className="px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {sorted.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-white">
                      {row.title}
                    </div>
                    {!row.published ? (
                      <span className="mt-0.5 inline-block rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Entwurf
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {LISTING_TYPE_LABELS[row.listing_type]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-32 items-center gap-2">
                      <span className="w-10 shrink-0 tabular-nums text-zinc-900 dark:text-white">
                        {row.views.toLocaleString("de-DE")}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{
                            width:
                              maxViews > 0
                                ? `${Math.max((row.views / maxViews) * 100, row.views > 0 ? 4 : 0)}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-900 dark:text-white">
                    {row.inquiries.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-900 dark:text-white">
                    {formatPercent(row.conversionRate)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={listingPublicPath(row.slug)}
                      className="text-amber-700 hover:underline dark:text-amber-400"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ansehen
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
