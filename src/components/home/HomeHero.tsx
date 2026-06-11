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
  isAdmin: boolean;
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

export default function HomeHero({ copy, isAdmin }: Props) {
  return (
    <FullBleed className="bg-[var(--surface-hero)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="order-1 flex justify-center bg-transparent md:order-2">
            <Image
              src="/hero/porsche-anhaenger.png"
              alt="Porsche 911 auf einem Anhänger — elbe-trailer Verkauf und Vermietung"
              width={1024}
              height={445}
              priority
              unoptimized
              className="h-auto w-full max-w-lg md:max-w-xl"
            />
          </div>

          <div className="order-2 md:order-1">
            <p className="text-sm font-semibold tracking-wide text-[var(--header-green)] uppercase">
              <AdminInlineMarketingContentEditor
                contentKey="home.hero.brand"
                value={copy.brand}
                isAdmin={isAdmin}
              />
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 uppercase sm:text-3xl lg:text-4xl">
              <AdminInlineMarketingContentEditor
                contentKey="home.hero.title"
                value={copy.title}
                isAdmin={isAdmin}
                multiline
              />
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              <AdminInlineMarketingContentEditor
                contentKey="home.hero.subtitle"
                value={copy.subtitle}
                isAdmin={isAdmin}
                multiline
              />
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#kategorien"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[var(--header-green)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 sm:flex-none"
              >
                <IconTrailer />
                <AdminInlineMarketingContentEditor
                  contentKey="home.hero.cta_buy"
                  value={copy.ctaBuy}
                  isAdmin={isAdmin}
                  inlineOnly
                />
              </Link>
              <Link
                href="/mieten"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-[var(--header-green)] bg-white px-5 py-3 text-sm font-semibold text-[var(--header-green)] transition hover:bg-emerald-50 sm:flex-none"
              >
                <IconCalendar />
                <AdminInlineMarketingContentEditor
                  contentKey="home.hero.cta_rent"
                  value={copy.ctaRent}
                  isAdmin={isAdmin}
                  inlineOnly
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FullBleed>
  );
}
