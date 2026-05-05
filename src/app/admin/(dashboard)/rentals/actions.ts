"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { removeObjects } from "@/lib/storage-provider";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RentalFormActionState =
  | undefined
  | { ok: false; error: string }
  | { ok: true };

function parseEuroToCents(v: FormDataEntryValue | null): number {
  if (v == null || v === "") return 0;
  const n = Number.parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

async function ensureRentalAccessoryCategory(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
) {
  const { data: existing } = await supabase
    .from("accessory_categories")
    .select("id")
    .ilike("name", "mieten")
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("accessory_categories")
    .insert({
      name: "Mieten",
      sort_order: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error("Miet-Zubehör-Kategorie konnte nicht angelegt werden.");
  }

  return created.id as string;
}

function sanitizeDate(value: FormDataEntryValue | null): string | null {
  const date = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

export async function createRentalUnit(
  _prev: RentalFormActionState,
  formData: FormData,
): Promise<RentalFormActionState> {
  const { supabase } = await requireAdmin();
  const listingId = String(formData.get("listing_id") ?? "").trim();
  const minRentalDays =
    Number.parseInt(String(formData.get("min_rental_days") ?? "1"), 10) || 1;
  const active = formData.get("active") === "on";

  if (!listingId) {
    return { ok: false, error: "Bitte ein Inserat auswählen." };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .in("listing_type", ["miete", "kauf_und_miete"])
    .maybeSingle();

  if (!listing) {
    return { ok: false, error: "Inserat für Miete nicht gefunden." };
  }

  const { error } = await supabase.from("rental_units").insert({
    listing_id: listingId,
    min_rental_days: Math.max(1, minRentalDays),
    active,
  });

  if (error) {
    console.error(error);
    return { ok: false, error: "Mietobjekt konnte nicht angelegt werden." };
  }

  revalidatePath("/admin/rentals");
  redirect(withAdminSavedParam("/admin/rentals"));
}

export async function updateRentalUnit(
  _prev: RentalFormActionState,
  formData: FormData,
): Promise<RentalFormActionState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const minRentalDays =
    Number.parseInt(String(formData.get("min_rental_days") ?? "1"), 10) || 1;
  const active = formData.get("active") === "on";
  if (!id) return { ok: false, error: "Mietobjekt fehlt." };

  const { error } = await supabase
    .from("rental_units")
    .update({
      min_rental_days: Math.max(1, minRentalDays),
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { ok: false, error: "Mietobjekt konnte nicht gespeichert werden." };
  }

  revalidatePath("/admin/rentals");
  revalidatePath(`/admin/rentals/${id}`);
  redirect(withAdminSavedParam(`/admin/rentals/${id}`));
}

export async function addCalendarBlock(
  _prev: RentalFormActionState,
  formData: FormData,
): Promise<RentalFormActionState> {
  const { supabase } = await requireAdmin();
  const rentalUnitId = String(formData.get("rental_unit_id") ?? "").trim();
  const startDate = sanitizeDate(formData.get("start_date"));
  const endDate = sanitizeDate(formData.get("end_date"));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!rentalUnitId || !startDate || !endDate) {
    return { ok: false, error: "Zeitraum ist erforderlich." };
  }
  if (startDate > endDate) {
    return { ok: false, error: "Enddatum muss nach dem Startdatum liegen." };
  }

  const { error } = await supabase.from("rental_calendar_blocks").insert({
    rental_unit_id: rentalUnitId,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) {
    console.error(error);
    return { ok: false, error: "Kalendereintrag konnte nicht gespeichert werden." };
  }

  revalidatePath(`/admin/rentals/${rentalUnitId}`);
  revalidatePath("/admin/rentals");
  return { ok: true };
}

export async function deleteCalendarBlock(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const rentalUnitId = String(formData.get("rental_unit_id") ?? "").trim();
  if (!id || !rentalUnitId) return;

  await supabase.from("rental_calendar_blocks").delete().eq("id", id);
  revalidatePath(`/admin/rentals/${rentalUnitId}`);
  revalidatePath("/admin/rentals");
}

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const rentalUnitId = String(formData.get("rental_unit_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !rentalUnitId) return;
  if (!["pending", "confirmed", "cancelled"].includes(status)) return;

  await supabase
    .from("rental_bookings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/rentals/${rentalUnitId}`);
  revalidatePath("/admin/rentals");
  redirect(withAdminSavedParam(`/admin/rentals/${rentalUnitId}`));
}

export async function createRentalAccessory(
  _prev: RentalFormActionState,
  formData: FormData,
): Promise<RentalFormActionState> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dailyRateCents = parseEuroToCents(formData.get("daily_rate_eur"));
  const active = formData.get("active") === "on";

  if (!name) return { ok: false, error: "Name erforderlich." };

  try {
    const categoryId = await ensureRentalAccessoryCategory(supabase);
    const { error } = await supabase.from("accessories").insert({
      id: crypto.randomUUID(),
      name,
      description,
      category_id: categoryId,
      price_adjustment_cents: dailyRateCents,
      active,
    });
    if (error) {
      console.error(error);
      return { ok: false, error: "Miet-Zubehör konnte nicht angelegt werden." };
    }
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Miet-Zubehör-Kategorie konnte nicht geladen werden." };
  }

  revalidatePath("/admin/rentals");
  revalidatePath("/admin/accessories");
  return { ok: true };
}

export async function updateRentalAccessory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const dailyRateCents = parseEuroToCents(formData.get("daily_rate_eur"));
  const active = formData.get("active") === "on";

  if (!id || !name) return;

  const categoryId = await ensureRentalAccessoryCategory(supabase);
  await supabase
    .from("accessories")
    .update({
      name,
      description,
      category_id: categoryId,
      price_adjustment_cents: dailyRateCents,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/rentals");
  revalidatePath("/admin/accessories");
  redirect(withAdminSavedParam("/admin/rentals"));
}

export async function deleteRentalAccessory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const rentalCategoryId = await ensureRentalAccessoryCategory(supabase);
  const { data: row } = await supabase
    .from("accessories")
    .select("id, category_id, image_path")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.category_id !== rentalCategoryId) {
    redirect("/admin/rentals?error=delete-accessory-forbidden");
  }

  const { data: links } = await supabase
    .from("listing_accessories")
    .select("listing_id")
    .eq("accessory_id", id);

  if (row.image_path) {
    await removeObjects({
      bucket: "accessories",
      paths: [row.image_path],
      supabaseFallback: supabase,
    });
  }

  const { error } = await supabase.from("accessories").delete().eq("id", id);
  if (error) {
    console.error(error);
    redirect("/admin/rentals?error=delete-failed");
  }

  for (const link of links ?? []) {
    revalidatePath(`/inserat/${link.listing_id}`);
  }
  revalidatePath("/admin/rentals");
  revalidatePath("/admin/accessories");
  redirect("/admin/rentals");
}

export async function saveRentalUnitAccessories(formData: FormData) {
  const { supabase } = await requireAdmin();
  const rentalUnitId = String(formData.get("rental_unit_id") ?? "").trim();
  if (!rentalUnitId) return;

  const { data: rentalUnit } = await supabase
    .from("rental_units")
    .select("listing_id")
    .eq("id", rentalUnitId)
    .maybeSingle();
  if (!rentalUnit?.listing_id) return;

  const categoryId = await ensureRentalAccessoryCategory(supabase);
  const { data: rentalAccessories } = await supabase
    .from("accessories")
    .select("id")
    .eq("category_id", categoryId);

  const rentalAccessoryIds = (rentalAccessories ?? []).map((item) => item.id as string);
  const selectedIds = formData.getAll("accessory").map((value) => String(value));
  const selectedSet = new Set(selectedIds);

  if (rentalAccessoryIds.length) {
    await supabase
      .from("listing_accessories")
      .delete()
      .eq("listing_id", rentalUnit.listing_id)
      .in("accessory_id", rentalAccessoryIds);
  }

  for (const accessoryId of selectedSet) {
    if (!rentalAccessoryIds.includes(accessoryId)) continue;
    const maxRaw = String(formData.get(`max_${accessoryId}`) ?? "1");
    const maxQuantity = Number.parseInt(maxRaw, 10) || 1;
    await supabase.from("listing_accessories").insert({
      listing_id: rentalUnit.listing_id,
      accessory_id: accessoryId,
      max_quantity: Math.max(1, maxQuantity),
    });
  }

  revalidatePath(`/admin/rentals/${rentalUnitId}`);
  revalidatePath(`/inserat/${rentalUnit.listing_id}`);

  const ctx = String(formData.get("admin_context") ?? "");
  if (ctx === "rental-detail") {
    redirect(withAdminSavedParam(`/admin/rentals/${rentalUnitId}`));
  }
  redirect(withAdminSavedParam("/admin/rentals"));
}
