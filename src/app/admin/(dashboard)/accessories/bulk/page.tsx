import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import BulkUpload from "@/components/admin/BulkUpload";

export default async function AccessoriesBulkPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Zubehör – Bulk-Upload
        </h1>
        <Link
          href="/admin/accessories"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Zurück zu Zubehör
        </Link>
      </div>
      <BulkUpload
        templateHref="/api/admin/accessories/bulk-template"
        importHref="/api/admin/accessories/bulk-import"
        backHref="/admin/accessories"
        statusHint="Importiertes Zubehör wird inaktiv gespeichert und erscheint erst nach Aktivierung im Konfigurator. Bilder werden nicht mit importiert – diese pro Artikel nachträglich hinzufügen. Zeilen mit vorhandener Artikelnummer aktualisieren den bestehenden Artikel."
      />
    </div>
  );
}
