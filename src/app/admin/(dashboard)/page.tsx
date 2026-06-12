import Link from "next/link";
import { getListingAnalytics } from "@/lib/analytics/listing-stats";
import { requireAdmin } from "@/lib/auth/admin";

function formatPercent(value: number): string {
  if (value === 0) return "0 %";
  return `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
}

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();
  const [inquiriesNewCountResult, contactInquiriesNewCountResult, analytics] =
    await Promise.all([
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "neu"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "neu"),
    getListingAnalytics(supabase, "30d"),
  ]);
  const inquiriesNewCount = inquiriesNewCountResult.error?.message?.includes("status")
    ? 0
    : (inquiriesNewCountResult.count ?? 0);
  const contactInquiriesNewCount = contactInquiriesNewCountResult.error?.message?.includes(
    "status",
  )
    ? 0
    : (contactInquiriesNewCountResult.count ?? 0);
  const newInquiriesCount = inquiriesNewCount + contactInquiriesNewCount;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Dashboard
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Verwalten Sie Inserate, Zubehör, Portfolio-Einträge und Blog-Beiträge.
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Statistik (letzte 30 Tage)
          </h2>
          <Link
            href="/admin/analytics"
            className="text-sm text-amber-700 hover:underline dark:text-amber-400"
          >
            Details anzeigen →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Aufrufe</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
              {analytics.totalViews.toLocaleString("de-DE")}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Anfragen</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
              {analytics.totalInquiries.toLocaleString("de-DE")}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-500">Ø Conversion</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
              {formatPercent(analytics.averageConversionRate)}
            </p>
          </div>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/listings"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Inserate</span>
          <p className="mt-1 text-sm text-zinc-500">Anzeigen anlegen und bearbeiten</p>
        </Link>
        <Link
          href="/admin/rentals"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Anhänger mieten</span>
          <p className="mt-1 text-sm text-zinc-500">Mietobjekte und Kalender verwalten</p>
        </Link>
        <Link
          href="/admin/accessories"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Zubehör</span>
          <p className="mt-1 text-sm text-zinc-500">Artikel für Konfiguratoren</p>
        </Link>
        <Link
          href="/admin/highlights"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Portfolio</span>
          <p className="mt-1 text-sm text-zinc-500">Highlights auf der Startseite</p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="flex items-center gap-2 font-medium">
            Anfragen
            {newInquiriesCount > 0 ? (
              <span className="rounded-full bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white">
                {newInquiriesCount} neu
              </span>
            ) : null}
          </span>
          <p className="mt-1 text-sm text-zinc-500">
            Eingehende Kundenanfragen
            {newInquiriesCount > 0 ? ` · ${newInquiriesCount} neue Anfrage(n)` : ""}
          </p>
        </Link>
        <Link
          href="/admin/blog"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Blog</span>
          <p className="mt-1 text-sm text-zinc-500">
            Beiträge und Kategorien pflegen
          </p>
        </Link>
      </ul>
    </div>
  );
}
