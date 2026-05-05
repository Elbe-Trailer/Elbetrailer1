import AccessoryForm from "../AccessoryForm";
import { requireAdmin } from "@/lib/auth/admin";

export default async function NewAccessoryPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase
    .from("accessory_categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Zubehör anlegen
      </h1>
      <AccessoryForm categories={categories ?? []} />
    </div>
  );
}
