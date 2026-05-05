import { createClient } from "@/lib/supabase/server";
import HeaderNav, { type NavCategory } from "@/components/HeaderNav";

export default async function Header() {
  let categories: NavCategory[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = data ?? [];
  } catch {
    /* missing env / offline */
  }

  return <HeaderNav categories={categories} />;
}
