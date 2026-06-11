import Link from "next/link";
import CookieSettingsLink from "@/components/consent/CookieSettingsLink";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getOptionalAdmin } from "@/lib/auth/admin";
import { getMarketingContentMap } from "@/lib/marketing-content";
import AdminInlineMarketingContentEditor from "@/components/site/AdminInlineMarketingContentEditor";

export default async function Footer() {
  const admin = await getOptionalAdmin();
  const supabase = admin?.supabase ?? (await createClient());
  let categories: { slug: string; name: string }[] = [];
  try {
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order");
    categories = data ?? [];
  } catch {
    /* offline */
  }
  const copy = await getMarketingContentMap(supabase, [
    "footer.brand",
    "footer.description",
    "footer.section.categories",
    "footer.section.offer",
    "footer.section.legal",
    "footer.categories.empty",
    "footer.link.rent",
    "footer.link.highlights",
    "footer.link.category_overview",
    "footer.link.blog",
    "footer.link.about",
    "footer.link.contact",
    "footer.link.imprint",
    "footer.link.privacy",
    "footer.note.inquiries",
  ]);
  const isAdmin = Boolean(admin);

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-100 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              <AdminInlineMarketingContentEditor
                contentKey="footer.brand"
                value={copy["footer.brand"]}
                isAdmin={isAdmin}
              />
            </div>
            <div className="mt-3 max-w-xs leading-relaxed">
              <AdminInlineMarketingContentEditor
                contentKey="footer.description"
                value={copy["footer.description"]}
                isAdmin={isAdmin}
                multiline
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              <AdminInlineMarketingContentEditor
                contentKey="footer.section.categories"
                value={copy["footer.section.categories"]}
                isAdmin={isAdmin}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {categories.length === 0 ? (
                <li className="text-zinc-500">
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.categories.empty"
                    value={copy["footer.categories.empty"]}
                    isAdmin={isAdmin}
                  />
                </li>
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
            <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              <AdminInlineMarketingContentEditor
                contentKey="footer.section.offer"
                value={copy["footer.section.offer"]}
                isAdmin={isAdmin}
              />
            </div>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/mieten"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.rent"
                    value={copy["footer.link.rent"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/#angebote"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.highlights"
                    value={copy["footer.link.highlights"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/#kategorien"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.category_overview"
                    value={copy["footer.link.category_overview"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/blog"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.blog"
                    value={copy["footer.link.blog"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
              <AdminInlineMarketingContentEditor
                contentKey="footer.section.legal"
                value={copy["footer.section.legal"]}
                isAdmin={isAdmin}
              />
            </div>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/ueber-uns"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.about"
                    value={copy["footer.link.about"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/kontakt"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.contact"
                    value={copy["footer.link.contact"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/impressum"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.imprint"
                    value={copy["footer.link.imprint"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <Link
                  className="text-zinc-800 hover:underline dark:text-zinc-200"
                  href="/datenschutz"
                >
                  <AdminInlineMarketingContentEditor
                    contentKey="footer.link.privacy"
                    value={copy["footer.link.privacy"]}
                    isAdmin={isAdmin}
                    inlineOnly
                  />
                </Link>
              </li>
              <li>
                <CookieSettingsLink />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-8 text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <p>© {new Date().getFullYear()} elbe-trailer</p>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <ThemeToggle />
            <div className="text-xs">
              <AdminInlineMarketingContentEditor
                contentKey="footer.note.inquiries"
                value={copy["footer.note.inquiries"]}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
