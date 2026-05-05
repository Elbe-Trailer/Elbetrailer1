import type { ListingType } from "@/types/database";

export type CustomerListingMode = "kauf" | "miete";

/** Kauf-Kontext: Kategorien, Startseite. Miete-Kontext: z. B. /mieten mit ?ansicht=miete. */
export function resolveCustomerListingMode(
  listingType: ListingType,
  ansicht: string | undefined,
): CustomerListingMode {
  if (listingType === "kauf") return "kauf";
  if (listingType === "miete") return "miete";
  return ansicht === "miete" ? "miete" : "kauf";
}
