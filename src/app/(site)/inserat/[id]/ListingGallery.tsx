"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { publicStorageUrl } from "@/lib/storage";

type Props = {
  gallery: string[];
};

export default function ListingGallery({ gallery }: Props) {
  const [selectedPath, setSelectedPath] = useState(gallery[0]);

  const selectedImageUrl = useMemo(
    () => publicStorageUrl("listings", selectedPath),
    [selectedPath],
  );

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={selectedImageUrl}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
        />
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-2">
          {gallery.map((path) => {
            const thumbUrl = publicStorageUrl("listings", path);
            const selected = path === selectedPath;
            return (
              <button
                key={path}
                type="button"
                onClick={() => setSelectedPath(path)}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 transition dark:bg-zinc-800 ${
                  selected
                    ? "ring-2 ring-zinc-900 dark:ring-white"
                    : "ring-1 ring-zinc-200 hover:ring-zinc-400 dark:ring-zinc-700 dark:hover:ring-zinc-500"
                }`}
                aria-label="Bild auswählen"
                aria-pressed={selected}
              >
                <Image
                  src={thumbUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
