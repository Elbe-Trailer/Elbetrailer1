import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingType } from "@/types/database";

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

export type ListingAnalyticsRow = {
  id: string;
  title: string;
  slug: string;
  listing_type: ListingType;
  published: boolean;
  views: number;
  inquiries: number;
  conversionRate: number;
};

export type ListingAnalyticsSummary = {
  totalViews: number;
  totalInquiries: number;
  averageConversionRate: number;
  rows: ListingAnalyticsRow[];
};

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "7 Tage",
  "30d": "30 Tage",
  "90d": "90 Tage",
  all: "Gesamt",
};

export function analyticsPeriodLabel(period: AnalyticsPeriod): string {
  return PERIOD_LABELS[period];
}

export function parseAnalyticsPeriod(value: string | undefined): AnalyticsPeriod {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") {
    return value;
  }
  return "30d";
}

function periodStartDate(period: AnalyticsPeriod): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start.toISOString().slice(0, 10);
}

function periodStartIso(period: AnalyticsPeriod): string | null {
  if (period === "all") return null;
  const date = periodStartDate(period);
  if (!date) return null;
  return `${date}T00:00:00.000Z`;
}

export async function getListingAnalytics(
  supabase: SupabaseClient,
  period: AnalyticsPeriod = "30d",
): Promise<ListingAnalyticsSummary> {
  const viewDateFrom = periodStartDate(period);
  const inquiryFrom = periodStartIso(period);

  const [listingsResult, viewsResult, inquiriesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, slug, listing_type, published")
      .order("title", { ascending: true }),
    (() => {
      let query = supabase.from("listing_view_daily").select("listing_id, view_count");
      if (viewDateFrom) {
        query = query.gte("view_date", viewDateFrom);
      }
      return query;
    })(),
    (() => {
      let query = supabase.from("inquiries").select("listing_id");
      if (inquiryFrom) {
        query = query.gte("created_at", inquiryFrom);
      }
      return query;
    })(),
  ]);

  const listings = listingsResult.data ?? [];
  const viewsByListing = new Map<string, number>();
  for (const row of viewsResult.data ?? []) {
    viewsByListing.set(
      row.listing_id,
      (viewsByListing.get(row.listing_id) ?? 0) + row.view_count,
    );
  }

  const inquiriesByListing = new Map<string, number>();
  for (const row of inquiriesResult.data ?? []) {
    inquiriesByListing.set(
      row.listing_id,
      (inquiriesByListing.get(row.listing_id) ?? 0) + 1,
    );
  }

  const rows: ListingAnalyticsRow[] = listings.map((listing) => {
    const views = viewsByListing.get(listing.id) ?? 0;
    const inquiries = inquiriesByListing.get(listing.id) ?? 0;
    const conversionRate = views > 0 ? (inquiries / views) * 100 : 0;
    return {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      listing_type: listing.listing_type as ListingType,
      published: listing.published,
      views,
      inquiries,
      conversionRate,
    };
  });

  rows.sort((a, b) => b.views - a.views || b.inquiries - a.inquiries);

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const totalInquiries = rows.reduce((sum, row) => sum + row.inquiries, 0);
  const averageConversionRate =
    totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

  return {
    totalViews,
    totalInquiries,
    averageConversionRate,
    rows,
  };
}
