"use server";

import { withAdminSavedParam } from "@/lib/admin/saved-query";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeBlogHtml } from "@/lib/blog-content";
import { removeObjects, uploadObject } from "@/lib/storage-provider";
import { revalidatePath } from "next/cache";
import { normalizeSlug } from "@/lib/slug";
import { redirect } from "next/navigation";

export type SaveBlogPostState = undefined | { ok: false; error: string };

function formatUploadErrorMessage(message: string | undefined): string {
  const msg = (message ?? "").toLowerCase();
  if (msg.includes("cloudflare r2 ist nicht konfiguriert")) {
    return "Cover-Upload fehlgeschlagen: Cloudflare R2 Konfiguration fehlt.";
  }
  return `Cover-Upload fehlgeschlagen${message ? `: ${message}` : "."}`;
}

export async function saveBlogPost(
  _prev: SaveBlogPostState,
  formData: FormData,
): Promise<SaveBlogPostState> {
  const { supabase } = await requireAdmin();
  const rawId = String(formData.get("id") ?? "").trim();
  const isNew = !rawId || rawId === "new";

  const title = String(formData.get("title") ?? "").trim();
  let slug = normalizeSlug(String(formData.get("slug") ?? ""));
  if (!slug && title) slug = normalizeSlug(title);
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const content = sanitizeBlogHtml(String(formData.get("content") ?? ""));
  const author = String(formData.get("author") ?? "").trim() || null;
  const categoryRaw = String(formData.get("category_id") ?? "").trim();
  const category_id = categoryRaw || null;
  const published = formData.get("published") === "on";
  const publishedAtRaw = String(formData.get("published_at") ?? "").trim();
  let published_at: string | null = null;
  if (published) {
    if (publishedAtRaw) {
      const d = new Date(publishedAtRaw);
      published_at = Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } else {
      published_at = new Date().toISOString();
    }
  }

  const file = formData.get("cover") as File | null;
  const hasFile = file && typeof file !== "string" && file.size > 0;

  if (!title || !slug) {
    return { ok: false, error: "Titel und Slug sind Pflichtfelder." };
  }

  let cover_image_path: string | null = null;
  if (hasFile) {
    const safe = file!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${safe}`;
    const up = await uploadObject({
      bucket: "blog",
      path,
      file: file!,
    });
    if (!up.ok) {
      return { ok: false, error: formatUploadErrorMessage(up.error) };
    }
    cover_image_path = path;
  }

  const nowIso = new Date().toISOString();

  if (isNew) {
    const { data: inserted, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title,
        excerpt,
        content,
        author,
        cover_image_path: cover_image_path ?? null,
        category_id,
        published,
        published_at: published ? published_at : null,
        updated_at: nowIso,
      })
      .select("id")
      .single();
    if (error || !inserted?.id) {
      console.error(error);
      return {
        ok: false,
        error: "Anlegen fehlgeschlagen (Slug eindeutig?).",
      };
    }
    revalidatePath("/blog");
    redirect(withAdminSavedParam(`/admin/blog/${inserted.id}`));
  }

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("cover_image_path, published_at, slug")
    .eq("id", rawId)
    .single();

  const finalCover = cover_image_path ?? existing?.cover_image_path ?? null;

  let nextPublishedAt: string | null = null;
  if (published) {
    if (publishedAtRaw) {
      const d = new Date(publishedAtRaw);
      nextPublishedAt = Number.isNaN(d.getTime())
        ? (existing?.published_at ?? nowIso)
        : d.toISOString();
    } else {
      nextPublishedAt = existing?.published_at ?? nowIso;
    }
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug,
      title,
      excerpt,
      content,
      author,
      cover_image_path: finalCover,
      category_id,
      published,
      published_at: published ? nextPublishedAt : null,
      updated_at: nowIso,
    })
    .eq("id", rawId);

  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen (Slug eindeutig?)." };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (existing?.slug && existing.slug !== slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
  revalidatePath("/admin/blog");
  redirect(withAdminSavedParam(`/admin/blog/${rawId}`));
}

export async function deleteBlogPost(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from("blog_posts")
    .select("cover_image_path, slug")
    .eq("id", id)
    .single();

  if (row?.cover_image_path) {
    await removeObjects({
      bucket: "blog",
      paths: [row.cover_image_path],
    });
  }

  await supabase.from("blog_posts").delete().eq("id", id);

  revalidatePath("/blog");
  if (row?.slug) revalidatePath(`/blog/${row.slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function updateBlogPostContent(
  _prev: { ok: false; error: string } | { ok: true } | undefined,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = sanitizeBlogHtml(String(formData.get("content") ?? ""));

  if (!id || !slug) {
    return { ok: false as const, error: "Ungültiger Beitrag." };
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { ok: false as const, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  return { ok: true as const };
}
