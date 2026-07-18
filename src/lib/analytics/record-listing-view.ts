import { createServiceClient } from "@/lib/supabase/service";

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|linkedinbot|whatsapp|preview|archiver|wget|curl|python-requests|headless/i;

function isBotUserAgent(userAgent: string): boolean {
  return BOT_UA_PATTERN.test(userAgent);
}

type RecordListingViewOptions = {
  isAdminPreview?: boolean;
  /**
   * User-Agent des Requests. Muss vom Aufrufer übergeben werden, da
   * `headers()` nicht innerhalb von `after()` aufgerufen werden darf
   * (Next.js 16). Vor dem `after()`-Callback auslesen und hier durchreichen.
   */
  userAgent?: string;
};

export async function recordListingView(
  listingId: string,
  options: RecordListingViewOptions = {},
): Promise<void> {
  if (options.isAdminPreview) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  if (isBotUserAgent(options.userAgent ?? "")) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc("increment_listing_view", {
      p_listing_id: listingId,
    });
    if (error) {
      console.error(
        "[analytics] increment_listing_view failed:",
        error.message,
        error.code,
      );
    }
  } catch (err) {
    console.error("[analytics] increment_listing_view threw:", err);
  }
}
