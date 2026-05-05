import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import type { Accessory } from "@/types/database";
import { deleteAccessory } from "../actions";
import AccessoryForm from "../AccessoryForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditAccessoryPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: row }, { data: categories }] = await Promise.all([
    supabase.from("accessories").select("*").eq("id", id).maybeSingle(),
    supabase.from("accessory_categories").select("id, name").order("sort_order"),
  ]);
  if (!row) notFound();
  const accessory = row as Accessory;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Zubehör bearbeiten
      </h1>
      <AccessoryForm accessory={accessory} categories={categories ?? []} />
      <form action={deleteAccessory} className="border-t border-red-200 pt-8 dark:border-red-900">
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Löschen
        </button>
      </form>
    </div>
  );
}
