import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import BulkUpload from "@/components/admin/BulkUpload";

export default async function ListingsBulkPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Inserate – Bulk-Upload
        </h1>
        <Link
          href="/admin/listings"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Zurück zu Inserate
        </Link>
      </div>
      <BulkUpload
        templateHref="/api/admin/listings/bulk-template"
        importHref="/api/admin/listings/bulk-import"
        backHref="/admin/listings"
        statusHint="Importierte Inserate werden als Entwurf gespeichert (nicht veröffentlicht) und erscheinen erst nach Freigabe im Shop. Bilder werden nicht mit importiert – diese pro Inserat nachträglich hinzufügen. Zeilen mit vorhandener Artikelnummer aktualisieren das bestehende Inserat."
      />
    </div>
  );
}
