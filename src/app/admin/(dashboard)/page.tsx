import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Dashboard
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Verwalten Sie Inserate, Zubehör, Banner, Portfolio-Einträge und Blog-Beiträge.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/listings"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Inserate</span>
          <p className="mt-1 text-sm text-zinc-500">Anzeigen anlegen und bearbeiten</p>
        </Link>
        <Link
          href="/admin/rentals"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Anhänger mieten</span>
          <p className="mt-1 text-sm text-zinc-500">Mietobjekte und Kalender verwalten</p>
        </Link>
        <Link
          href="/admin/accessories"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Zubehör</span>
          <p className="mt-1 text-sm text-zinc-500">Artikel für Konfiguratoren</p>
        </Link>
        <Link
          href="/admin/banners"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Banner</span>
          <p className="mt-1 text-sm text-zinc-500">Startseiten-Karussell</p>
        </Link>
        <Link
          href="/admin/highlights"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Portfolio</span>
          <p className="mt-1 text-sm text-zinc-500">Highlights auf der Startseite</p>
        </Link>
        <Link
          href="/admin/inquiries"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Anfragen</span>
          <p className="mt-1 text-sm text-zinc-500">Eingehende Kundenanfragen</p>
        </Link>
        <Link
          href="/admin/blog"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <span className="font-medium">Blog</span>
          <p className="mt-1 text-sm text-zinc-500">
            Beiträge und Kategorien pflegen
          </p>
        </Link>
      </ul>
    </div>
  );
}
