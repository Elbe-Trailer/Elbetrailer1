import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminForApi } from "@/lib/auth/admin";
import { importAccessories, ACCESSORY_COLUMNS } from "@/lib/admin/bulk-import";
import { parseUploadedWorkbook } from "@/lib/admin/bulk-xlsx";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await getAdminForApi();
  if (!admin) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Keine Datei gefunden." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Datei ist zu groß (max. 10 MB)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseUploadedWorkbook(buffer, ACCESSORY_COLUMNS);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.rows.length === 0) {
    return NextResponse.json({ error: "Keine Datenzeilen gefunden." }, { status: 400 });
  }

  const report = await importAccessories(admin.supabase, parsed.rows);

  if (report.created > 0 || report.updated > 0) {
    revalidatePath("/admin/accessories");
  }

  return NextResponse.json({ report });
}
