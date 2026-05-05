import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Footer() {
  let categories: { slug: string; name: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = data ?? [];
  } catch {
    /* offline */
  }

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-100 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              elbe-trailer
            </p>
            <p className="mt-3 max-w-xs leading-relaxed">
              Inserate mit technischen Angaben, Zubehör-Auswahl und
              unverbindlicher Anfrage — orientiert an bewährter
              Branchen-Information, übersichtlich aufgebaut.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              Kategorien
            </p>
            <ul className="mt-4 space-y-2">
              {categories.length === 0 ? (
                <li className="text-zinc-500">Keine Kategorien</li>
              ) : (
                categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      className="text-zinc-800 hover:underline dark:text-zinc-200"
                      href={`/kategorie/${c.slug}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              Angebot
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/mieten"
                >
                  Mieten
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/#angebote"
                >
                  Ausgewählte Angebote
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/#kategorien"
                >
                  Kategorieüberblick
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              Rechtliches & Kontakt
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/ueber-uns"
                >
                  Über uns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-8 text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <p>© {new Date().getFullYear()} elbe-trailer</p>
          <p className="text-xs">Hinweis: Unverbindliche Anfragen über die Inserate.</p>
        </div>
      </div>
    </footer>
  );
}
