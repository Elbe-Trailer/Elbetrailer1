import Link from "next/link";
import { Suspense } from "react";
import AdminSaveSuccessBanner from "@/components/admin/AdminSaveSuccessBanner";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "./actions";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/listings", label: "Inserate" },
  { href: "/admin/rentals", label: "Anhänger mieten" },
  { href: "/admin/accessories", label: "Zubehör" },
  { href: "/admin/banners", label: "Banner" },
  { href: "/admin/highlights", label: "Portfolio" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/blog/categories", label: "Blog-Kategorien" },
  { href: "/admin/inquiries", label: "Anfragen" },
  { href: "/admin/categories", label: "Kategorien" },
  { href: "/admin/accessory-categories", label: "Zubehör-Kategorien" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:w-56">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Admin
          </p>
          <nav className="mt-4 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Abmelden
            </button>
          </form>
          <Link
            href="/"
            className="mt-2 block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Zur Website
          </Link>
        </aside>
        <main className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Suspense fallback={null}>
            <AdminSaveSuccessBanner />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
