import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type BookedRange = { start_date: string; end_date: string };

/**
 * Bestätigte Buchungszeiträume einer Mieteinheit (nur Datumsspalten).
 *
 * rental_bookings enthält Kundendaten (Name, E-Mail, Telefon) und ist daher
 * nicht öffentlich lesbar – gelesen wird serverseitig über den Service-Client.
 * Mit `overlap` werden nur Zeiträume geliefert, die [from, to] überschneiden.
 */
export async function getConfirmedBookingRanges(
  rentalUnitId: string,
  overlap?: { from: string; to: string },
): Promise<BookedRange[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[rental-bookings] SUPABASE_SERVICE_ROLE_KEY is not configured");
    return [];
  }

  let query = createServiceClient()
    .from("rental_bookings")
    .select("start_date, end_date")
    .eq("rental_unit_id", rentalUnitId)
    .eq("status", "confirmed");
  if (overlap) {
    query = query.lte("start_date", overlap.to).gte("end_date", overlap.from);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[rental-bookings] query failed:", error.message);
    return [];
  }
  return (data ?? []) as BookedRange[];
}
