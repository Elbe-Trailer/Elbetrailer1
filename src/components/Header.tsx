import { createClient } from "@/lib/supabase/server";
import { getOptionalAdmin } from "@/lib/auth/admin";
import HeaderNav, { type NavCategory } from "@/components/HeaderNav";
import { getMarketingContentMap } from "@/lib/marketing-content";

export default async function Header() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  let categories: NavCategory[] = [];
  try {
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = data ?? [];
  } catch {
    /* missing env / offline */
  }

  const copy = await getMarketingContentMap(supabase, [
    "header.brand",
    "header.menu.trailers",
    "header.menu.all_trailers",
    "header.menu.no_categories",
    "header.menu.rent",
    "header.nav.about",
    "header.nav.service",
    "header.nav.rent_trailers",
    "header.nav.blog",
    "header.nav.contact",
    "header.mobile.categories_title",
    "header.mobile.no_categories",
    "header.mobile.menu_open",
    "header.mobile.menu_close",
  ]);

  return <HeaderNav categories={categories} copy={copy} isAdmin={Boolean(admin)} />;
}
