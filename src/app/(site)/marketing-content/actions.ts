"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  MARKETING_CONTENT_FALLBACKS,
  type MarketingContentKey,
} from "@/lib/marketing-content";

type State = { ok: false; error: string } | { ok: true } | undefined;

const ALLOWED_KEYS = new Set<MarketingContentKey>(
  Object.keys(MARKETING_CONTENT_FALLBACKS) as MarketingContentKey[],
);

const REVALIDATE_PATHS = ["/", "/ueber-uns", "/service", "/kontakt", "/impressum"];

function normalizeMarketingPlainText(raw: string) {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export async function updateMarketingContent(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const { supabase } = await requireAdmin();
  const key = String(formData.get("key") ?? "").trim() as MarketingContentKey;
  const content = normalizeMarketingPlainText(String(formData.get("content") ?? "").trim());

  if (!ALLOWED_KEYS.has(key) || !content) {
    return { ok: false, error: "Ungültige Inhaltsangaben." };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("marketing_content").upsert(
    {
      key,
      label: MARKETING_CONTENT_FALLBACKS[key].label,
      content,
      updated_at: nowIso,
    },
    { onConflict: "key" },
  );

  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { ok: true };
}

export async function updateMarketingContentBatch(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const { supabase } = await requireAdmin();
  const rawPayload = String(formData.get("entries") ?? "").trim();
  if (!rawPayload) {
    return { ok: false, error: "Keine Inhalte zum Speichern." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return { ok: false, error: "Ungültiges Datenformat." };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: "Ungültige Inhaltsangaben." };
  }

  const updates: { key: MarketingContentKey; label: string; content: string; updated_at: string }[] = [];
  const nowIso = new Date().toISOString();

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Ungültige Inhaltsangaben." };
    }
    const key = String((item as { key?: string }).key ?? "").trim() as MarketingContentKey;
    const content = normalizeMarketingPlainText(
      String((item as { content?: string }).content ?? "").trim(),
    );

    if (!ALLOWED_KEYS.has(key) || !content) {
      return { ok: false, error: "Ungültige Inhaltsangaben." };
    }

    updates.push({
      key,
      label: MARKETING_CONTENT_FALLBACKS[key].label,
      content,
      updated_at: nowIso,
    });
  }

  if (!updates.length) {
    return { ok: false, error: "Keine Inhalte zum Speichern." };
  }

  const { error } = await supabase.from("marketing_content").upsert(updates, {
    onConflict: "key",
  });

  if (error) {
    console.error(error);
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { ok: true };
}
