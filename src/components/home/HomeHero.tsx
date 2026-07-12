import Link from "next/link";
import Image from "next/image";
import FullBleed from "@/components/FullBleed";
import AdminInlineMarketingContentEditor from "@/components/site/AdminInlineMarketingContentEditor";

type HeroCopy = {
  brand: string;
  title: string;
  subtitle: string;
  ctaBuy: string;
  ctaRent: string;
};

type Props = {
  copy: HeroCopy;
};

function IconTrailer({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="1" y="8" width="16" height="8" rx="1" />
      <path d="M17 8h3v6h-3" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export default function HomeHero({ copy }: Props) {
  return (
    <FullBleed className="relative isolate overflow-hidden bg-[var(--surface-hero)]">
      {/* Full-width background photo */}
      <Image
        src="/hero/hero-website.png"
        alt="Elbe-Trailer Verkaufs- und Vermietungsplatz mit Anhängern bei Hamburg"
        fill
        preload
        quality={90}
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      {/* Left-to-right dark scrim so the text stays readable over the photo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/10 md:via-black/40 md:to-transparent" />

      <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-4 py-16 md:min-h-[580px] md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-emerald-300 uppercase">
            <AdminInlineMarketingContentEditor
              contentKey="home.hero.brand"
              value={copy.brand}
            />
          </p>

          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-pretty whitespace-pre-line text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-4xl">
            <AdminInlineMarketingContentEditor
              contentKey="home.hero.title"
              value={copy.title}
              multiline
            />
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-lg">
            <AdminInlineMarketingContentEditor
              contentKey="home.hero.subtitle"
              value={copy.subtitle}
              multiline
            />
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#kategorien"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--header-green)] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 sm:flex-none"
            >
              <IconTrailer />
              <AdminInlineMarketingContentEditor
                contentKey="home.hero.cta_buy"
                value={copy.ctaBuy}
                inlineOnly
              />
            </Link>
            <Link
              href="/mieten"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-white bg-white px-5 py-3 text-sm font-semibold text-[var(--header-green)] shadow-lg transition hover:bg-emerald-50 sm:flex-none"
            >
              <IconCalendar />
              <AdminInlineMarketingContentEditor
                contentKey="home.hero.cta_rent"
                value={copy.ctaRent}
                inlineOnly
              />
            </Link>
          </div>
        </div>
      </div>
    </FullBleed>
  );
}
