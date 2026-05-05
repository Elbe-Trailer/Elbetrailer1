"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

export type NavCategory = { slug: string; name: string };

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

type Props = { categories: NavCategory[] };

export default function HeaderNav({ categories }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!mobileOpen) return;
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOpen]);

  const menuBarGreen = "#2f9e44";

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Haupt-Menübalken: grün, Logo + Navigation */}
      <div
        className="text-white"
        style={{ backgroundColor: menuBarGreen }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:py-3.5">
          <Link
            href="/"
            className="shrink-0 text-2xl font-bold tracking-tight text-white sm:text-3xl"
            onClick={() => setMobileOpen(false)}
          >
            elbe-trailer
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-1 lg:flex xl:gap-2">
            {/* Anhänger + Kategorien */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-0.5 rounded px-2 py-2 text-sm font-medium text-white/95 hover:bg-white/10 xl:px-3"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Anhänger
                <IconChevronDown className="h-4 w-4 opacity-90" />
              </button>
              <div
                className="invisible absolute left-0 top-full z-[60] min-w-[16rem] pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                role="navigation"
                aria-label="Anhänger-Kategorien"
              >
                <div className="overflow-hidden rounded-md bg-white py-2 text-sm text-zinc-900 shadow-xl ring-1 ring-black/10">
                  <Link
                    href="/anhaenger"
                    className="block px-4 py-2.5 font-medium hover:bg-zinc-50"
                  >
                    Alle Anhänger
                  </Link>
                  {categories.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500">
                      Keine Kategorien — bitte im Admin anlegen.
                    </p>
                  ) : (
                    <ul>
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/kategorie/${c.slug}`}
                            className="block px-4 py-2.5 hover:bg-zinc-50"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t border-zinc-100">
                    <Link
                      href="/mieten"
                      className="block px-4 py-2.5 font-medium text-[var(--header-coral)] hover:bg-zinc-50"
                    >
                      Mieten
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/ueber-uns"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              Über uns
            </Link>
            <Link
              href="/service"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              Service
            </Link>
            <Link
              href="/mieten"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              Anhänger mieten
            </Link>
            <Link
              href="/blog"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              Blog
            </Link>
            <Link
              href="/kontakt"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              Kontakt
            </Link>

            <Link
              href="/#kategorien"
              className="ml-1 flex items-center rounded p-2 hover:bg-white/10"
              aria-label="Suche"
            >
              <IconSearch className="h-6 w-6" />
            </Link>
          </div>

          {/* Mobile: Suche + Menü */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              href="/#kategorien"
              className="rounded p-2 hover:bg-white/10"
              aria-label="Suche"
            >
              <IconSearch className="h-6 w-6" />
            </Link>
            <button
              type="button"
              className="rounded p-2 hover:bg-white/10"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-6 rounded-full bg-white" />
                <span className="block h-0.5 w-6 rounded-full bg-white" />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile ausklappbar */}
        {mobileOpen ? (
          <div
            id={menuId}
            className="border-t border-white/25 bg-white text-zinc-900 lg:hidden"
          >
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label="Mobile Hauptnavigation">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Anhänger — Kategorien
              </p>
              <Link
                href="/anhaenger"
                className="block rounded-md px-3 py-2.5 font-medium hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Alle Anhänger
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/kategorie/${c.slug}`}
                  className="block rounded-md px-3 py-2.5 pl-6 hover:bg-zinc-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-500">
                  Noch keine Kategorien in der Datenbank.
                </p>
              ) : null}
              <Link
                href="/mieten"
                className="block rounded-md px-3 py-2.5 font-medium text-[var(--header-coral)] hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Mieten
              </Link>

              <hr className="my-3 border-zinc-200" />

              <Link
                href="/ueber-uns"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Über uns
              </Link>
              <Link
                href="/service"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Service
              </Link>
              <Link
                href="/mieten"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Anhänger mieten
              </Link>
              <Link
                href="/blog"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/kontakt"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                Kontakt
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
