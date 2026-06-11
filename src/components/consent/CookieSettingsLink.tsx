"use client";

import { openCookieSettings } from "@/lib/consent";

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-200"
    >
      Cookie-Einstellungen
    </button>
  );
}
