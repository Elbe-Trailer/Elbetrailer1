import { getAdminForApi } from "@/lib/auth/admin";
import { ACCESSORY_COLUMNS } from "@/lib/admin/bulk-import";
import { buildTemplateWorkbook } from "@/lib/admin/bulk-xlsx";

export async function GET() {
  const admin = await getAdminForApi();
  if (!admin) {
    return new Response("Nicht berechtigt.", { status: 403 });
  }

  const { data: categories } = await admin.supabase
    .from("accessory_categories")
    .select("name")
    .order("sort_order", { ascending: true });
  const categoryNames = (categories ?? []).map((c) => c.name as string);

  const buffer = await buildTemplateWorkbook(
    ACCESSORY_COLUMNS,
    categoryNames,
    "Zubehör",
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="zubehoer-vorlage.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
