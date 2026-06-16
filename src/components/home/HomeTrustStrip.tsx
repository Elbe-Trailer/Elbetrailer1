import FullBleed from "@/components/FullBleed";
import AdminInlineMarketingContentEditor from "@/components/site/AdminInlineMarketingContentEditor";

type TrustCopy = {
  item1: string;
  item2: string;
  item3: string;
  item4: string;
};

type Props = {
  copy: TrustCopy;
};

function IconCart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconPuzzle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29 2.5 2.5 0 1 0-4.066-2.066 1.026 1.026 0 0 0 .29-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.235-1.234.706-1.704L4.28 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214 1.026 1.026 0 0 1-.29-.877l1.568-1.568A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.235 1.704.706l1.568 1.568c.23.23.556.338.877.29a2.5 2.5 0 1 0 3.256 3.256" />
    </svg>
  );
}

function IconWrench({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconStopwatch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3M6 19l-2 2M18 19l2 2" />
    </svg>
  );
}

const TRUST_ITEMS = [
  { key: "home.trust.item1" as const, fallback: "Kaufen & mieten", Icon: IconCart },
  { key: "home.trust.item2" as const, fallback: "Zubehör passend", Icon: IconPuzzle },
  { key: "home.trust.item3" as const, fallback: "Anfrage in Minuten", Icon: IconStopwatch },
  {
    key: "home.trust.item4" as const,
    fallback: "Anhänger Service und Reparatur",
    Icon: IconWrench,
  },
] as const;

export default function HomeTrustStrip({ copy }: Props) {
  const values = [copy.item1, copy.item2, copy.item3, copy.item4];

  return (
    <FullBleed className="border-y border-zinc-200/80 bg-[var(--surface-hero)]">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <ul className="flex flex-wrap sm:flex-nowrap sm:divide-x sm:divide-zinc-200">
          {TRUST_ITEMS.map(({ key, fallback, Icon }, index) => (
            <li
              key={key}
              className="flex min-w-0 flex-1 basis-1/2 items-center justify-center gap-2 px-2 py-1 sm:basis-0 sm:px-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[var(--header-green)] sm:h-10 sm:w-10">
                <Icon />
              </span>
              <span className="min-w-0 text-xs leading-snug font-medium text-balance text-zinc-600 sm:text-sm">
                <AdminInlineMarketingContentEditor
                  contentKey={key}
                  value={values[index] || fallback}
                  inlineOnly
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </FullBleed>
  );
}
