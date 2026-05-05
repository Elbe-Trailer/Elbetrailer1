"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { publicStorageUrl } from "@/lib/storage";
import type { BannerSlide } from "@/types/database";

type Props = { slides: BannerSlide[]; variant?: "default" | "hero" };

export default function BannerCarousel({ slides, variant = "default" }: Props) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const next = useCallback(() => setI((p) => (n ? (p + 1) % n : 0)), [n]);
  const prev = useCallback(
    () => setI((p) => (n ? (p - 1 + n) % n : 0)),
    [n],
  );

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [n, next]);

  const isHero = variant === "hero";

  if (n === 0) {
    const emptyH = isHero ? "min-h-[min(70vh,520px)]" : "h-48";
    const emptyRounded = isHero ? "rounded-none" : "rounded-xl";
    return (
      <div
        className={`flex ${emptyH} items-center justify-center ${emptyRounded} bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 px-6 text-center text-sm text-zinc-300`}
      >
        Noch keine Banner — im Admin-Bereich Bilder hinterlegen.
      </div>
    );
  }

  const slide = slides[i];
  const src = publicStorageUrl("banners", slide.image_path);
  const frameH = isHero
    ? "min-h-[min(70vh,520px)] sm:min-h-[min(75vh,560px)]"
    : "h-56 sm:h-72";
  const frameRounded = isHero ? "rounded-none" : "rounded-xl";
  const inner = (
    <div
      className={`relative w-full overflow-hidden ${frameRounded} bg-zinc-200 ${frameH} dark:bg-zinc-800`}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        priority
        unoptimized={!process.env.NEXT_PUBLIC_SUPABASE_URL}
      />
    </div>
  );

  return (
    <div className="relative">
      {slide.link_url ? (
        <Link href={slide.link_url} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
      {n > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur-sm dark:bg-zinc-900/90 ${
              isHero ? "left-4 md:left-8" : "left-2"
            }`}
            aria-label="Vorheriges Banner"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur-sm dark:bg-zinc-900/90 ${
              isHero ? "right-4 md:right-8" : "right-2"
            }`}
            aria-label="Nächstes Banner"
          >
            ›
          </button>
          <div
            className={`flex justify-center gap-1.5 ${isHero ? "absolute bottom-6 left-0 right-0 z-20" : "mt-2"}`}
          >
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setI(idx)}
                className={`h-2 w-2 rounded-full transition ${
                  isHero
                    ? idx === i
                      ? "bg-white"
                      : "bg-white/45 hover:bg-white/70"
                    : idx === i
                      ? "bg-zinc-900 dark:bg-white"
                      : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                aria-label={`Banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
