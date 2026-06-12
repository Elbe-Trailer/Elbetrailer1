import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|linkedinbot|whatsapp|preview|archiver|wget|curl|python-requests|headless/i;

function isBotUserAgent(userAgent: string): boolean {
  return BOT_UA_PATTERN.test(userAgent);
}

type RecordListingViewOptions = {
  isAdminPreview?: boolean;
};

export async function recordListingView(
  listingId: string,
  options: RecordListingViewOptions = {},
): Promise<void> {
  if (options.isAdminPreview) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  if (isBotUserAgent(userAgent)) return;

  try {
    const supabase = createServiceClient();
    await supabase.rpc("increment_listing_view", { p_listing_id: listingId });
  } catch {
    // Non-critical: do not block page rendering on tracking failures.
  }
}
