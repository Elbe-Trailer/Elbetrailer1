import { getAdminForApi } from "@/lib/auth/admin";
import { LISTING_COLUMNS } from "@/lib/admin/bulk-import";
import { buildTemplateWorkbook } from "@/lib/admin/bulk-xlsx";

export async function GET() {
  const admin = await getAdminForApi();
  if (!admin) {
    return new Response("Nicht berechtigt.", { status: 403 });
  }

  const { data: categories } = await admin.supabase
    .from("categories")
    .select("name")
    .order("sort_order", { ascending: true });
  const categoryNames = (categories ?? []).map((c) => c.name as string);

  const buffer = await buildTemplateWorkbook(
    LISTING_COLUMNS,
    categoryNames,
    "Inserate",
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="inserate-vorlage.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
