"use server";

import { sendListingInquiryEmails } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import type { AccessorySelection } from "@/types/database";
import { revalidatePath } from "next/cache";

export type SubmitInquiryState =
  | { ok: true }
  | { ok: false; error: string };

export async function submitInquiry(
  _prev: SubmitInquiryState | undefined,
  formData: FormData,
): Promise<SubmitInquiryState> {
  const listingId = formData.get("listing_id") as string;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();
  const customerAnsicht = String(formData.get("customer_ansicht") ?? "").trim();
  const rawSelections = formData.get("accessory_selections");
  let accessory_selections: AccessorySelection[] = [];
  try {
    if (typeof rawSelections === "string" && rawSelections) {
      accessory_selections = JSON.parse(rawSelections) as AccessorySelection[];
    }
  } catch {
    return { ok: false, error: "Ungültige Konfiguration." };
  }

  if (!listingId || !name || !email) {
    return { ok: false, error: "Name und E-Mail sind Pflichtfelder." };
  }

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, listing_type, title")
    .eq("id", listingId)
    .eq("published", true)
    .maybeSingle();

  if (!listing) {
    return { ok: false, error: "Inserat nicht gefunden." };
  }

  const selectedAccessoryIds = accessory_selections
    .filter((s) => s.quantity > 0)
    .map((s) => s.accessory_id);

  if (selectedAccessoryIds.length) {
    const { data: allowedRows } = await supabase
      .from("listing_accessories")
      .select("accessory_id")
      .eq("listing_id", listingId);
    const allowed = new Set(
      (allowedRows ?? []).map((r) => r.accessory_id as string),
    );
    for (const id of selectedAccessoryIds) {
      if (!allowed.has(id)) {
        return { ok: false, error: "Ungültige Konfiguration." };
      }
    }

    const { data: accRows } = await supabase
      .from("accessories")
      .select("id, category_id, accessory_categories(allows_multiple)")
      .in("id", selectedAccessoryIds)
      .eq("active", true);

    const countSingleCategory = new Map<string, number>();
    for (const sel of accessory_selections) {
      if (sel.quantity <= 0) continue;
      const row = accRows?.find((r) => r.id === sel.accessory_id);
      const catId = row?.category_id as string | null | undefined;
      const allowsMultiple = (
        row as {
          accessory_categories?: { allows_multiple?: boolean } | null;
        }
      )?.accessory_categories?.allows_multiple;
      if (catId != null && allowsMultiple === false) {
        countSingleCategory.set(
          catId,
          (countSingleCategory.get(catId) ?? 0) + 1,
        );
      }
    }
    for (const n of countSingleCategory.values()) {
      if (n > 1) {
        return {
          ok: false,
          error:
            "In einer Zubehör-Kategorie ist nur eine Option gleichzeitig möglich.",
        };
      }
    }
  }

  const { data: rentalUnit } = await supabase
    .from("rental_units")
    .select("id, min_rental_days, active")
    .eq("listing_id", listingId)
    .eq("active", true)
    .maybeSingle();

  const wantsRentalContext =
    listing.listing_type === "miete" ||
    (listing.listing_type === "kauf_und_miete" && customerAnsicht === "miete");

  const isRentalInquiry = wantsRentalContext && !!rentalUnit;

  if (isRentalInquiry) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return { ok: false, error: "Bitte gültige Mietdaten auswählen." };
    }
    if (startDate > endDate) {
      return { ok: false, error: "Enddatum muss nach dem Startdatum liegen." };
    }
    const millisPerDay = 1000 * 60 * 60 * 24;
    const diffDays =
      Math.floor(
        (new Date(`${endDate}T00:00:00Z`).getTime() -
          new Date(`${startDate}T00:00:00Z`).getTime()) /
          millisPerDay,
      ) + 1;
    if (diffDays < rentalUnit.min_rental_days) {
      return {
        ok: false,
        error: `Mindestens ${rentalUnit.min_rental_days} Miettag(e) erforderlich.`,
      };
    }

    const [{ data: conflictsBlocks }, { data: conflictsBookings }] =
      await Promise.all([
        supabase
          .from("rental_calendar_blocks")
          .select("id")
          .eq("rental_unit_id", rentalUnit.id)
          .lte("start_date", endDate)
          .gte("end_date", startDate)
          .limit(1),
        supabase
          .from("rental_bookings")
          .select("id")
          .eq("rental_unit_id", rentalUnit.id)
          .eq("status", "confirmed")
          .lte("start_date", endDate)
          .gte("end_date", startDate)
          .limit(1),
      ]);

    if ((conflictsBlocks?.length ?? 0) > 0 || (conflictsBookings?.length ?? 0) > 0) {
      return { ok: false, error: "Dieser Zeitraum ist leider nicht verfügbar." };
    }
  }

  const { data: insertedInquiry, error } = await supabase
    .from("inquiries")
    .insert({
    listing_id: listingId,
    name,
    email,
    phone: phone || null,
    message: message || null,
    accessory_selections,
      rental_unit_id: isRentalInquiry ? rentalUnit!.id : null,
      start_date: isRentalInquiry ? startDate : null,
      end_date: isRentalInquiry ? endDate : null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return { ok: false, error: "Anfrage konnte nicht gespeichert werden." };
  }

  if (isRentalInquiry) {
    const { error: bookingError } = await supabase.from("rental_bookings").insert({
      rental_unit_id: rentalUnit!.id,
      inquiry_id: insertedInquiry.id,
      status: "pending",
      start_date: startDate,
      end_date: endDate,
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      customer_message: message || null,
    });

    if (bookingError) {
      console.error(bookingError);
      await supabase.from("inquiries").delete().eq("id", insertedInquiry.id);
      return { ok: false, error: "Buchungsanfrage konnte nicht erstellt werden." };
    }
  }

  const accessoryLines: {
    name: string;
    articleNumber: string | null;
    quantity: number;
    priceAdjustmentCents: number;
  }[] = [];

  if (selectedAccessoryIds.length > 0) {
    const { data: accessoryRows } = await supabase
      .from("accessories")
      .select("id, name, article_number, price_adjustment_cents")
      .in("id", selectedAccessoryIds);

    const accessoryById = new Map(
      (accessoryRows ?? []).map((row) => [
        row.id as string,
        {
          name: String(row.name),
          articleNumber:
            row.article_number == null ? null : String(row.article_number),
          priceAdjustmentCents:
            typeof row.price_adjustment_cents === "number"
              ? row.price_adjustment_cents
              : 0,
        },
      ]),
    );

    for (const selection of accessory_selections) {
      if (selection.quantity <= 0) continue;
      const accessory = accessoryById.get(selection.accessory_id);
      if (!accessory) continue;
      accessoryLines.push({
        ...accessory,
        quantity: selection.quantity,
      });
    }
  }

  try {
    await sendListingInquiryEmails({
      customerName: name,
      customerEmail: email,
      customerPhone: phone || null,
      customerMessage: message || null,
      listingId,
      listingTitle: String(listing.title),
      startDate: isRentalInquiry ? startDate : null,
      endDate: isRentalInquiry ? endDate : null,
      accessories: accessoryLines,
    });
  } catch (emailError) {
    console.error("[submitInquiry] email failed:", emailError);
  }

  revalidatePath(`/inserat/${listingId}`);
  return { ok: true };
}
