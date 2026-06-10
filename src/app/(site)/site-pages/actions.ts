"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeBlogHtml } from "@/lib/blog-content";
import type { SitePageSlug } from "@/lib/site-pages";

type State = { ok: false; error: string } | { ok: true } | undefined;

const ALLOWED_SLUGS = new Set<SitePageSlug>([
  "ueber-uns",
  "service",
  "kontakt",
  "impressum",
  "datenschutz",
]);

export async function updateSitePageContent(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const { supabase } = await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim() as SitePageSlug;
  const title = String(formData.get("title") ?? "").trim();
  const content = sanitizeBlogHtml(String(formData.get("content") ?? ""));

  if (!ALLOWED_SLUGS.has(slug) || !title) {
    return { ok: false, error: "Ungültige Seitenangaben." };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("site_pages").upsert(
    {
      slug,
      title,
      content,
      updated_at: nowIso,
    },
    { onConflict: "slug" },
  );

  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  if (slug === "ueber-uns") revalidatePath("/ueber-uns");
  if (slug === "service") revalidatePath("/service");
  if (slug === "kontakt") revalidatePath("/kontakt");
  if (slug === "impressum") revalidatePath("/impressum");
  if (slug === "datenschutz") revalidatePath("/datenschutz");
  return { ok: true };
}
