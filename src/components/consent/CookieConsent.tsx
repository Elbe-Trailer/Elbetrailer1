"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CookieSettingsDialog from "@/components/consent/CookieSettingsDialog";
import {
  CONSENT_CHANGED_EVENT,
  needsConsentChoice,
  notifyConsentChanged,
  OPEN_COOKIE_SETTINGS_EVENT,
  revokeAnalyticsTracking,
  writeConsent,
} from "@/lib/consent";

const buttonClass =
  "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const syncBanner = () => setShowBanner(needsConsentChoice());
    syncBanner();

    const onConsentChange = () => syncBanner();
    const onOpenSettings = () => setShowSettings(true);

    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    };
  }, []);

  function accept(level: "necessary" | "analytics") {
    if (level === "necessary") {
      revokeAnalyticsTracking();
    }
    writeConsent(level);
    notifyConsentChanged();
    setShowBanner(false);
  }

  return (
    <>
      {showBanner ? (
        <div
          role="dialog"
          aria-label="Cookie-Einstellungen"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Wir verwenden technisch notwendige Speicherungen für den Betrieb
              der Website. Mit Ihrer Einwilligung nutzen wir zusätzlich Google
              Analytics zur Reichweitenmessung. „Nur notwendige“ lehnt die
              Webanalyse ab.{" "}
              <Link
                href="/datenschutz#webanalyse"
                className="underline hover:text-zinc-900 dark:hover:text-white"
              >
                Mehr in der Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => accept("necessary")}
                className={buttonClass}
              >
                Nur notwendige
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className={buttonClass}
              >
                Einstellungen
              </button>
              <button
                type="button"
                onClick={() => accept("analytics")}
                className={buttonClass}
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CookieSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
