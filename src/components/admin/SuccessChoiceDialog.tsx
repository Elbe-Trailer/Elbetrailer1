"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  overviewLabel: string;
  continueLabel: string;
  overviewHref: string;
  continueHref: string;
};

export default function SuccessChoiceDialog({
  open,
  title,
  description,
  overviewLabel,
  continueLabel,
  overviewHref,
  continueHref,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open, mounted]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <dialog
      ref={ref}
      className="fixed left-1/2 top-1/2 z-[100] m-0 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-black/40 dark:border-zinc-700 dark:bg-zinc-900 dark:backdrop:bg-black/60"
      onCancel={(e) => e.preventDefault()}
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <button
          type="button"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => router.push(overviewHref)}
        >
          {overviewLabel}
        </button>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          onClick={() => router.push(continueHref)}
        >
          {continueLabel}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
