"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { listingPublicPath } from "@/lib/listing-url";
import { ensureUniqueSlug, normalizeSlug } from "@/lib/slug";
import { removeObjects, uploadObject } from "@/lib/storage-provider";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteListing(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await requireAdmin();
  const { data: listing } = await supabase
    .from("listings")
    .select("gallery_paths")
    .eq("id", id)
    .single();
  const paths = listing?.gallery_paths as string[] | undefined;
  if (paths?.length) {
    await removeObjects({
      bucket: "listings",
      paths,
      supabaseFallback: supabase,
    });
  }
  await supabase.from("listings").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}


function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseEuroToCents(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export type SaveListingState =
  | undefined
  | { ok: false; error: string }
  | { ok: true; listingId: string; created: boolean };

export async function saveListing(
  _prev: SaveListingState,
  formData: FormData,
): Promise<SaveListingState> {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim() || null;
  const wasNew = !id;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Titel erforderlich." };

  let slugInput = normalizeSlug(String(formData.get("slug") ?? ""));
  if (!slugInput) slugInput = normalizeSlug(title);
  if (!slugInput) return { ok: false, error: "Slug erforderlich." };

  const { data: existingListing } = id
    ? await supabase.from("listings").select("slug").eq("id", id).maybeSingle()
    : { data: null };

  const slug = await ensureUniqueSlug(
    slugInput,
    async (candidate) => {
      const { data } = await supabase
        .from("listings")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      return Boolean(data && data.id !== id);
    },
    existingListing?.slug ?? undefined,
  );

  const category_id = String(formData.get("category_id") ?? "");
  if (!category_id) return { ok: false, error: "Kategorie wählen." };
  const offer_kauf = formData.get("offer_kauf") === "on";
  const offer_miete = formData.get("offer_miete") === "on";
  if (!offer_kauf && !offer_miete) {
    return { ok: false, error: "Bitte mindestens Kauf oder Miete auswählen." };
  }
  const listing_type = (offer_kauf && offer_miete
    ? "kauf_und_miete"
    : offer_kauf
      ? "kauf"
      : "miete") as "kauf" | "miete" | "kauf_und_miete";
  const published = formData.get("published") === "on";
  const description = String(formData.get("description") ?? "").trim() || null;
  const article_number =
    String(formData.get("article_number") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "").trim() || null;
  const hasKauf = listing_type === "kauf" || listing_type === "kauf_und_miete";
  const hasMiete = listing_type === "miete" || listing_type === "kauf_und_miete";
  const price_cents = hasKauf ? parseEuroToCents(formData.get("price_eur")) : null;
  const daily_rate_cents = hasMiete
    ? parseEuroToCents(formData.get("daily_eur"))
    : null;

  if (hasKauf && price_cents == null) {
    return { ok: false, error: "Bitte Kaufpreis angeben." };
  }
  if (hasMiete && daily_rate_cents == null) {
    return { ok: false, error: "Bitte Mietpreis (Tagessatz) angeben." };
  }

  const payload_kg = parseIntOrNull(formData.get("payload_kg"));
  const exterior_length_mm = parseIntOrNull(formData.get("exterior_length_mm"));
  const exterior_width_mm = parseIntOrNull(formData.get("exterior_width_mm"));
  const loading_length_mm = parseIntOrNull(formData.get("loading_length_mm"));
  const loading_width_mm = parseIntOrNull(formData.get("loading_width_mm"));
  const gross_weight_kg = parseIntOrNull(formData.get("gross_weight_kg"));
  const empty_weight_kg = parseIntOrNull(formData.get("empty_weight_kg"));
  const tire_size_inch = parseFloatOrNull(formData.get("tire_size_inch"));
  const axle_count = parseIntOrNull(formData.get("axle_count"));
  const brakedRaw = String(formData.get("braked") ?? "").trim();
  const braked =
    brakedRaw === "yes" ? true : brakedRaw === "no" ? false : null;
  const tip_function = String(formData.get("tip_function") ?? "").trim() || null;
  const lighting = String(formData.get("lighting") ?? "").trim() || null;
  const loading_ramps =
    String(formData.get("loading_ramps") ?? "").trim() || null;
  const loading_area = String(formData.get("loading_area") ?? "").trim() || null;

  const accessoryIds = formData.getAll("accessory").map((v) => String(v).trim()).filter(Boolean);
  const files = formData.getAll("images") as File[];

  const row = {
    slug,
    title,
    article_number,
    brand,
    description,
    price_cents,
    daily_rate_cents,
    condition,
    exterior_length_mm,
    exterior_width_mm,
    loading_length_mm,
    loading_width_mm,
    gross_weight_kg,
    payload_kg,
    empty_weight_kg,
    tire_size_inch,
    axle_count,
    braked,
    tip_function,
    lighting,
    loading_ramps,
    loading_area,
    category_id,
    listing_type,
    published,
    updated_at: new Date().toISOString(),
  };

  let listingId = id;

  if (!listingId) {
    const { data: inserted, error } = await supabase
      .from("listings")
      .insert({ ...row, gallery_paths: [] })
      .select("id")
      .single();
    if (error || !inserted) {
      console.error(error);
      return { ok: false, error: "Inserat konnte nicht angelegt werden." };
    }
    listingId = inserted.id as string;
  } else {
    const { error } = await supabase
      .from("listings")
      .update(row)
      .eq("id", listingId);
    if (error) {
      console.error(error);
      return { ok: false, error: "Inserat konnte nicht gespeichert werden." };
    }
  }

  const newPaths: string[] = [];
  for (const file of files) {
    if (!file || typeof file === "string" || file.size === 0) continue;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${listingId}/${Date.now()}-${safe}`;
    const up = await uploadObject({
      bucket: "listings",
      path,
      file,
      supabaseFallback: supabase,
    });
    if (up.ok) newPaths.push(path);
  }

  if (newPaths.length) {
    const { data: current } = await supabase
      .from("listings")
      .select("gallery_paths")
      .eq("id", listingId)
      .single();
    const existing = (current?.gallery_paths as string[]) ?? [];
    await supabase
      .from("listings")
      .update({
        gallery_paths: [...existing, ...newPaths],
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId);
  }

  await supabase
    .from("listing_accessories")
    .delete()
    .eq("listing_id", listingId);

  for (const accId of accessoryIds) {
    const mq = parseIntOrNull(formData.get(`max_${accId}`)) ?? 1;
    await supabase.from("listing_accessories").insert({
      listing_id: listingId,
      accessory_id: accId,
      max_quantity: Math.max(1, mq),
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/listings");
  revalidatePath(listingPublicPath(slug));

  if (wasNew) {
    return { ok: true, listingId, created: true };
  }
  redirect(withAdminSavedParam(`/admin/listings/${listingId}`));
}
