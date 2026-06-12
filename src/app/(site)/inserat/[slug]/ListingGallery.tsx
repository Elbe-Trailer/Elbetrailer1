"use client";

import { useState } from "react";
import StorageImage from "@/components/StorageImage";

type Props = {
  gallery: string[];
  title: string;
};

export default function ListingGallery({ gallery, title }: Props) {
  const [selectedPath, setSelectedPath] = useState(gallery[0]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <StorageImage
          bucket="listings"
          path={selectedPath}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
        />
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-2">
          {gallery.map((path, index) => {
            const selected = path === selectedPath;
            const thumbAlt = `${title} — Bild ${index + 1}`;
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
                aria-label={thumbAlt}
                aria-pressed={selected}
              >
                <StorageImage
                  bucket="listings"
                  path={path}
                  alt={thumbAlt}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
