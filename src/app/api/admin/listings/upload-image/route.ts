import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadObject } from "@/lib/storage-provider";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
// The client downscales/compresses before upload; this is a safety ceiling for
// the raw file so a huge original still fails cleanly with a clear message
// instead of blowing up the request.
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json(
      { error: "Keine Bilddatei gefunden." },
      { status: 400 },
    );
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Dateityp nicht erlaubt (JPG, PNG, WEBP, GIF, AVIF)." },
      { status: 400 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Bild ist zu groß (max. 15 MB)." },
      { status: 400 },
    );
  }

  // New listings have no id yet, so group those uploads under "pending".
  const listingId = String(formData.get("listingId") ?? "").replace(
    /[^a-zA-Z0-9-]/g,
    "",
  );
  const prefix = listingId || "pending";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${prefix}/${Date.now()}-${rand}-${safeFilename(file.name)}`;

  const up = await uploadObject({ bucket: "listings", path, file });
  if (!up.ok) {
    return NextResponse.json(
      { error: up.error || "Upload fehlgeschlagen." },
      { status: 500 },
    );
  }

  return NextResponse.json({ path });
}
