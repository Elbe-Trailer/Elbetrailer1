import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { publicStorageUrl } from "@/lib/storage";
import { deleteBanner } from "./actions";
import BannerForm from "./BannerForm";

export default async function AdminBannersPage() {
  const { supabase } = await requireAdmin();
  const { data: banners } = await supabase
    .from("banner_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Banner
      </h1>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Neues Banner</h2>
        <BannerForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Bestehend</h2>
        {!banners?.length ? (
          <p className="text-zinc-500">Keine Banner.</p>
        ) : (
          <ul className="space-y-8">
            {banners.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-4 border-b border-zinc-200 pb-8 dark:border-zinc-700 lg:flex-row"
              >
                <div className="relative h-36 w-full max-w-xl overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={publicStorageUrl("banners", b.image_path)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="640px"
                    unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-zinc-500">
                    Sortierung: {b.sort_order} ·{" "}
                    {b.active ? "aktiv" : "inaktiv"}
                    {b.link_url ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link
                          href={b.link_url}
                          className="text-amber-700 underline"
                        >
                          Link
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <BannerForm banner={b} />
                  <form action={deleteBanner}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Banner löschen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
