import { requireAdmin } from "@/lib/auth/admin";
import AccessoryCategoryForm from "./AccessoryCategoryForm";

export default async function AdminAccessoryCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data: cats } = await supabase
    .from("accessory_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Zubehör-Kategorien
      </h1>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Neue Kategorie</h2>
        <AccessoryCategoryForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Bearbeiten</h2>
        <ul className="space-y-8">
          {(cats ?? []).map((c) => (
            <li
              key={c.id}
              className="border-b border-zinc-200 pb-8 dark:border-zinc-700"
            >
              <AccessoryCategoryForm category={c} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
