import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  analyticsPeriodLabel,
  getListingAnalytics,
  parseAnalyticsPeriod,
} from "@/lib/analytics/listing-stats";
import AnalyticsTable from "./AnalyticsTable";

type Props = {
  searchParams: Promise<{ zeitraum?: string }>;
};

function formatPercent(value: number): string {
  if (value === 0) return "0 %";
  return `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const period = parseAnalyticsPeriod(sp.zeitraum);
  const stats = await getListingAnalytics(supabase, period);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Statistik</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Inserat-Aufrufe und Conversion zu Anfragen — {analyticsPeriodLabel(period)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Aufrufe</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {stats.totalViews.toLocaleString("de-DE")}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Anfragen</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {stats.totalInquiries.toLocaleString("de-DE")}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Ø Conversion-Rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {formatPercent(stats.averageConversionRate)}
          </p>
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        Nur Detailseiten-Aufrufe (/inserat/…). Admin-Vorschau und Bots werden nicht gezählt.
        Conversion = Anfragen ÷ Aufrufe.
      </p>

      <Suspense fallback={<p className="text-zinc-500">Lade Tabelle…</p>}>
        <AnalyticsTable rows={stats.rows} period={period} />
      </Suspense>
    </div>
  );
}
