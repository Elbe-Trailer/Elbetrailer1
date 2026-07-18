"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { getCategoryIconPath, getCategoryIconScale } from "@/lib/categoryIcons";
import AdminInlineMarketingContentEditor from "@/components/site/AdminInlineMarketingContentEditor";
import { COMPANY } from "@/lib/company";

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

function IconPhone({ className }: { className?: string }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const PHONE_TEL = COMPANY.phoneTel;
const PHONE_DISPLAY = COMPANY.phoneDisplay;

type HeaderCopy = Record<
  | "header.brand"
  | "header.menu.trailers"
  | "header.menu.all_trailers"
  | "header.menu.no_categories"
  | "header.menu.rent"
  | "header.nav.about"
  | "header.nav.service"
  | "header.nav.rent_trailers"
  | "header.nav.blog"
  | "header.nav.contact"
  | "header.mobile.categories_title"
  | "header.mobile.no_categories"
  | "header.mobile.menu_open"
  | "header.mobile.menu_close",
  string
>;

type Props = { categories: NavCategory[]; copy: HeaderCopy };

export default function HeaderNav({ categories, copy }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
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

  // Höhe des Menübalkens messen, damit das aufgeklappte Mobil-Menü exakt den
  // verbleibenden Viewport ausfüllt und in sich selbst scrollt – statt die
  // gesamte Seite zu verlängern (dann waren die letzten Punkte erst nach dem
  // Scrollen bis ganz nach unten sichtbar).
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () => setBarHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Haupt-Menübalken: grün, Logo + Navigation */}
      <div
        className="bg-[var(--header-green)] text-white"
      >
        <div
          ref={barRef}
          className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:py-3.5"
        >
          <Link
            href="/"
            className="shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <img
              src="/brand/header-logo.png"
              alt={`${copy["header.brand"]} — Verkauf und Vermietung`}
              decoding="async"
              fetchPriority="high"
              className="block w-auto object-contain object-left"
              style={{ height: "2.25rem", width: "auto" }}
            />
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
                <AdminInlineMarketingContentEditor
                  contentKey="header.menu.trailers"
                  value={copy["header.menu.trailers"]}
                  inlineOnly
                />
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
                    <AdminInlineMarketingContentEditor
                      contentKey="header.menu.all_trailers"
                      value={copy["header.menu.all_trailers"]}
                      inlineOnly
                    />
                  </Link>
                  {categories.length === 0 ? (
                    <p className="px-4 py-3 text-zinc-500">
                      <AdminInlineMarketingContentEditor
                        contentKey="header.menu.no_categories"
                        value={copy["header.menu.no_categories"]}
                        inlineOnly
                      />
                    </p>
                  ) : (
                    <ul>
                      {categories.map((c) => {
                        const iconPath = getCategoryIconPath(c);
                        const iconScale = getCategoryIconScale(c);
                        return (
                          <li key={c.slug}>
                            <Link
                              href={`/kategorie/${c.slug}`}
                              className="flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-50"
                            >
                              {iconPath ? (
                                <span className="flex h-6 w-12 shrink-0 items-center justify-center overflow-hidden">
                                  <Image
                                    src={iconPath}
                                    alt=""
                                    width={36}
                                    height={14}
                                    className="h-auto w-full object-contain object-center"
                                    style={{ transform: `scale(${Math.min(iconScale, 1.25)})`, transformOrigin: "center" }}
                                  />
                                </span>
                              ) : null}
                              {c.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="border-t border-zinc-100">
                    <Link
                      href="/mieten"
                      className="block px-4 py-2.5 font-medium text-[var(--header-coral)] hover:bg-zinc-50"
                    >
                      <AdminInlineMarketingContentEditor
                        contentKey="header.menu.rent"
                        value={copy["header.menu.rent"]}
                        inlineOnly
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/ueber-uns"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              <AdminInlineMarketingContentEditor
                contentKey="header.nav.about"
                value={copy["header.nav.about"]}
                inlineOnly
              />
            </Link>
            <Link
              href="/service"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              <AdminInlineMarketingContentEditor
                contentKey="header.nav.service"
                value={copy["header.nav.service"]}
                inlineOnly
              />
            </Link>
            <Link
              href="/mieten"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              <AdminInlineMarketingContentEditor
                contentKey="header.nav.rent_trailers"
                value={copy["header.nav.rent_trailers"]}
                inlineOnly
              />
            </Link>
            <Link
              href="/blog"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              <AdminInlineMarketingContentEditor
                contentKey="header.nav.blog"
                value={copy["header.nav.blog"]}
                inlineOnly
              />
            </Link>
            <Link
              href="/kontakt"
              className="rounded px-2 py-2 text-sm font-medium hover:bg-white/10 xl:px-3"
            >
              <AdminInlineMarketingContentEditor
                contentKey="header.nav.contact"
                value={copy["header.nav.contact"]}
                inlineOnly
              />
            </Link>

            <Link
              href="/#kategorien"
              className="ml-1 flex items-center rounded p-2 hover:bg-white/10"
              aria-label="Suche"
            >
              <IconSearch className="h-6 w-6" />
            </Link>

            <a
              href={`tel:${PHONE_TEL}`}
              className="ml-1 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              aria-label={`elbe-trailer anrufen: ${PHONE_DISPLAY}`}
              title={`Anrufen: ${PHONE_DISPLAY}`}
            >
              <IconPhone className="h-5 w-5" />
              <span className="hidden xl:inline">{PHONE_DISPLAY}</span>
            </a>
          </div>

          {/* Mobile: Telefon + Suche + Menü */}
          <div className="flex items-center gap-1 lg:hidden">
            <a
              href={`tel:${PHONE_TEL}`}
              className="rounded p-2 hover:bg-white/10"
              aria-label={`elbe-trailer anrufen: ${PHONE_DISPLAY}`}
            >
              <IconPhone className="h-6 w-6" />
            </a>
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
              aria-label={
                mobileOpen ? copy["header.mobile.menu_close"] : copy["header.mobile.menu_open"]
              }
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-6 rounded-full bg-white" />
                <span className="block h-0.5 w-6 rounded-full bg-white" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile ausklappbar — Overlay-Panel mit eigenem Scroll, damit alle
          Punkte erreichbar sind, ohne die ganze Seite scrollen zu müssen */}
      {mobileOpen ? (
        <div
          id={menuId}
          className="absolute inset-x-0 top-full overflow-y-auto overscroll-contain border-t border-black/5 bg-white text-zinc-900 shadow-xl lg:hidden"
          style={{ maxHeight: `calc(100dvh - ${barHeight || 64}px)` }}
        >
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label="Mobile Hauptnavigation">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <AdminInlineMarketingContentEditor
                  contentKey="header.mobile.categories_title"
                  value={copy["header.mobile.categories_title"]}
                  inlineOnly
                />
              </p>
              <Link
                href="/anhaenger"
                className="block rounded-md px-3 py-2.5 font-medium hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.menu.all_trailers"
                  value={copy["header.menu.all_trailers"]}
                  inlineOnly
                />
              </Link>
              {categories.map((c) => {
                const iconPath = getCategoryIconPath(c);
                const iconScale = getCategoryIconScale(c);
                return (
                  <Link
                    key={c.slug}
                    href={`/kategorie/${c.slug}`}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 pl-6 hover:bg-zinc-100"
                    onClick={() => setMobileOpen(false)}
                  >
                    {iconPath ? (
                      <span className="flex h-6 w-12 shrink-0 items-center justify-center overflow-hidden">
                        <Image
                          src={iconPath}
                          alt=""
                          width={36}
                          height={14}
                          className="h-auto w-full object-contain object-center"
                          style={{ transform: `scale(${Math.min(iconScale, 1.25)})`, transformOrigin: "center" }}
                        />
                      </span>
                    ) : null}
                    {c.name}
                  </Link>
                );
              })}
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-zinc-500">
                  <AdminInlineMarketingContentEditor
                    contentKey="header.mobile.no_categories"
                    value={copy["header.mobile.no_categories"]}
                    inlineOnly
                  />
                </p>
              ) : null}
              <Link
                href="/mieten"
                className="block rounded-md px-3 py-2.5 font-medium text-[var(--header-coral)] hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.menu.rent"
                  value={copy["header.menu.rent"]}
                  inlineOnly
                />
              </Link>

              <hr className="my-3 border-zinc-200" />

              <Link
                href="/ueber-uns"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.nav.about"
                  value={copy["header.nav.about"]}
                  inlineOnly
                />
              </Link>
              <Link
                href="/service"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.nav.service"
                  value={copy["header.nav.service"]}
                  inlineOnly
                />
              </Link>
              <Link
                href="/mieten"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.nav.rent_trailers"
                  value={copy["header.nav.rent_trailers"]}
                  inlineOnly
                />
              </Link>
              <Link
                href="/blog"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.nav.blog"
                  value={copy["header.nav.blog"]}
                  inlineOnly
                />
              </Link>
              <Link
                href="/kontakt"
                className="block rounded-md px-3 py-2.5 hover:bg-zinc-100"
                onClick={() => setMobileOpen(false)}
              >
                <AdminInlineMarketingContentEditor
                  contentKey="header.nav.contact"
                  value={copy["header.nav.contact"]}
                  inlineOnly
                />
              </Link>
            </nav>
        </div>
      ) : null}
    </header>
  );
}
